# Lombok Usage Guide

Lombok is used in the CVGator Java backend to reduce boilerplate code such as getters,
constructors, builders, and constructor injection. It must be applied **carefully and
consistently**: careless use can introduce hidden behavior, expose CV data through generated
`toString()` methods, or cause subtle bugs if JPA is added later.

Project decision: CVGator uses Lombok for DTOs. Do not switch DTO guidance to Java records unless
the team explicitly revisits that decision.

---

## 1. General Principles

- **Reduce boilerplate, not visibility.** Lombok should remove mechanical code, not obscure
  design intent. If a generated method would surprise a reviewer, add it explicitly instead.
- **Prefer explicit, minimal annotations.** Annotate only what is needed. Do not apply
  `@Data` or `@Value` out of habit.
- **Never rely on Lombok-generated `toString()` for security-sensitive classes.** A generated
  `toString()` will eagerly print every field, including CV data, contact details, credentials,
  tokens, and API keys.
- **Never log objects directly.** Extract and log only safe, non-sensitive identifiers.
- **Avoid annotations that generate large amounts of implicit behavior** (e.g., `@Data`,
  `@Value`, `@ToString` on entities with relations).

### Quick rules

- Use `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@RequiredArgsConstructor`, `@Builder`, and `@Slf4j` when appropriate.
- Do **not** use `@Data`; it bundles `@ToString`, `@EqualsAndHashCode`, setters, and a constructor that are rarely all wanted together.
- Do **not** use `@ToString` on DTOs or on any class that contains CV data, contact details, passwords, tokens, or API keys.
- Do **not** use `@EqualsAndHashCode` or `@ToString` on future JPA entities with relations.
- Do **not** use `@Value`; it combines immutability, `@EqualsAndHashCode`, and `@ToString` implicitly.

---

## 2. API DTOs

**Location:** `apps/api/src/main/java/<base-package>/<feature>/api/dto`

The exact Java base package is still an open project decision. Until it is finalized, examples
use feature-oriented names such as `cv.api.dto`, `template.api.dto`, and `rendering.api.dto`.

DTOs carry data across the HTTP boundary. Request and response DTOs have different mutability
requirements and must be treated differently.

---

### 2.1 Request DTOs

**Pattern:**

```java
@Getter
@Setter
@NoArgsConstructor
```

**Why:**

- `@NoArgsConstructor` - Jackson requires a no-args constructor for JSON deserialization.
- `@Getter` + `@Setter` - Jackson uses setters to populate fields after construction; getters
  expose them for use in the application layer.
- No `@ToString` - prevents accidental logging of CV data, contact details, credentials, tokens, or
  other sensitive values that can appear in request bodies.

**Example:**

```java
@Getter
@Setter
@NoArgsConstructor
public class CvRenderRequestDto {

    @Valid
    @NotNull
    private CvDataDto cv;

    @NotBlank
    private String templateId;
}
```

> **Security rule:** Fields containing CV data, contact details, document HTML, PDF bytes,
> credentials, tokens, API keys, or secret keys must **never** appear in log output. Do not add
> `@ToString` to request DTOs.
> See [SENSITIVE_LOGGING.md](SENSITIVE_LOGGING.md) for the full policy.

---

### 2.2 Response DTOs

**Pattern:**

```java
@Getter
@AllArgsConstructor
```

Optional when a builder aids construction:

```java
@Builder
```

**Why:**

- Response DTOs are written once (by the application layer) and then serialized. Making them
  effectively immutable - no setters, all fields set via constructor - prevents accidental
  mutation after construction.
- `@AllArgsConstructor` provides a single, explicit constructor that enforces all fields are
  supplied at creation time.
- No `@ToString` - response DTOs can contain rendered HTML, PDF metadata, download URLs, or
  sensitive values; serialization is handled by Jackson, not `toString()`.

**Example:**

```java
@Getter
@AllArgsConstructor
@Builder
public class CvRenderResponseDto {

    private String templateId;

    private String html;
}
```

**Why not `@Data`?**

`@Data` generates `@ToString`, `@EqualsAndHashCode`, and setters - none of which are wanted on a
response DTO. It can expose rendered CV content in logs and allow callers to mutate a response
object after construction. Always prefer the explicit minimal pattern above.

---

## 3. Controllers and Services

Lombok usage in controllers and services should be minimal. The main concern is dependency
injection boilerplate.

**Recommended:**

```java
@RequiredArgsConstructor   // generates a constructor for all final fields
```

**Optional (only when the class actually logs):**

```java
@Slf4j
```

### Controllers

```java
@RestController
@RequestMapping("/api/v1/cvs/render")
@RequiredArgsConstructor
public class CvRenderController {

    private final CvRenderService cvRenderService;

    // ...
}
```

### Services

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CvRenderService {

    private final TemplateRenderer templateRenderer;
    private final PdfExportService pdfExportService;

    // ...
}
```

**Why `@RequiredArgsConstructor` over `@Autowired`?**

Spring recommends constructor injection: it makes dependencies explicit, supports immutability
(`final` fields), and simplifies unit testing. `@RequiredArgsConstructor` generates the
constructor automatically so no boilerplate is needed.

Do **not** add `@Slf4j` unless the class actually logs something - it creates an unused field
that generates a compiler warning.

---

## 4. Future JPA Entities

**Location:** `*.domain` or `*.infrastructure.persistence`

CVGator has no database in the initial MVP. If PostgreSQL and Spring Data JPA are added later, use
Lombok sparingly on entities because JPA lifecycle requirements conflict with many Lombok defaults.

**Recommended:**

```java
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
```

**Optional (only when needed):**

```java
@Setter(AccessLevel.PRIVATE)   // applied per-field, not at class level
```

**Why:**

- `@NoArgsConstructor(access = AccessLevel.PROTECTED)` - JPA providers (Hibernate) require a
  no-args constructor to instantiate proxy subclasses. Making it `PROTECTED` prevents arbitrary
  code from creating empty entity instances, which would bypass invariants.
- `@Getter` - read access is generally safe. Avoid class-level `@Setter`; control mutation
  through explicit domain methods instead.

**What to avoid:**

| Annotation | Why to avoid |
|---|---|
| `@Data` | Generates `@ToString` + `@EqualsAndHashCode` + setters - all problematic on entities |
| `@ToString` (with relations) | Triggers lazy-load of associated collections, causing `LazyInitializationException` or N+1 queries |
| `@EqualsAndHashCode` (with relations) | Causes infinite recursion or broken `HashSet` behavior on bidirectional relations |

**Example entity:**

```java
@Entity
@Table(name = "templates")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TemplateEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    // Use an explicit factory/constructor for controlled creation:
    public TemplateEntity(String id, String name) {
        this.id = id;
        this.name = name;
    }
}
```

> Never include CV data, rendered document content, credentials, or token columns in `@ToString`.
> If you need a `toString()` for debugging, write it explicitly and exclude sensitive fields.

---

## 5. Domain Value Objects

**Location:** `*.domain`

Value objects represent concepts in the domain that have no independent identity - they are
defined entirely by their attributes (e.g., `TemplateId`, `CvDocument`, or validated contact
details).

**Pattern:**

```java
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
```

**Why:**

- `@AllArgsConstructor` - allows direct construction with all values supplied.
- `@NoArgsConstructor(access = AccessLevel.PRIVATE)` - prevents empty instances from being
  created accidentally. The `PRIVATE` access means only the builder or factory methods can
  bypass it if needed (e.g., for frameworks that require it).
- `@Builder` - provides a safe, readable construction API, especially when a value object
  grows to have multiple optional fields.
- `@Getter` - value objects are immutable; no setters.
- No `@Setter` - value objects should not be mutated after creation.

**Example:**

```java
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class TemplateId {

    private String value;

    /** Factory that validates the format before constructing. */
    public static TemplateId of(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Template id must not be blank");
        }
        return new TemplateId(raw.trim());
    }
}
```

Validation logic belongs in a constructor, factory method (`of(...)`), or dedicated validator, not
in the Lombok-generated constructor. Use `@Builder` for construction in tests or assemblers; use
`of(...)` factory methods for validated creation in the application layer.

---

## 6. Logging Considerations

See [SENSITIVE_LOGGING.md](SENSITIVE_LOGGING.md) for the full project policy. Key rules:

- **Never log request DTOs directly.** Even if today's fields seem safe, a future field might
  not be, and there is no `@ToString` guard on mutable request DTOs.
- **Never log sensitive values.** Full CV data, contact details, rendered HTML, PDF bytes,
  passwords, tokens, and API keys must never appear in log output.
- **Log identifiers and correlation IDs instead.** A `templateId`, `requestId`, or `traceId`
  carries enough context for debugging without exposing sensitive values.

### Bad - logs the entire object (no @ToString, but future risk if added)

```java
// Even without @ToString this is a bad habit - if @ToString is ever added, CV data can leak.
log.info("Render request: {}", renderRequest);
```

### Bad - explicit sensitive values in log

```java
log.debug("Rendered CV HTML: {}", html);
log.info("CV contact email={}", email);
```

### Good - log safe identifiers only

```java
log.info("CV render requested templateId={} correlationId={}", templateId, correlationId);
log.debug("PDF export completed templateId={} durationMs={}", templateId, durationMs);
```

### Good - use redaction helpers for partial masking when value context is needed

```java
// platform.logging.Redaction
log.debug("Render requested for email={}", Redaction.maskEmail(email));
```

---

## 7. Summary Cheat Sheet

| Class type | Approved Lombok pattern |
|---|---|
| Request DTO | `@Getter` `@Setter` `@NoArgsConstructor` |
| Response DTO | `@Getter` `@AllArgsConstructor` (+ optional `@Builder`) |
| Controller | `@RequiredArgsConstructor` (+ optional `@Slf4j`) |
| Service | `@RequiredArgsConstructor` (+ optional `@Slf4j`) |
| Future JPA Entity | `@Getter` `@NoArgsConstructor(access = AccessLevel.PROTECTED)` |
| Domain Value Object | `@Getter` `@AllArgsConstructor` `@NoArgsConstructor(access = AccessLevel.PRIVATE)` `@Builder` |

### Blanket prohibitions

| Annotation | Reason |
|---|---|
| `@Data` | Too implicit: generates setters + `@ToString` + `@EqualsAndHashCode` |
| `@Value` | Implicitly generates `@ToString` + `@EqualsAndHashCode` |
| `@ToString` on DTOs or secrets | Leaks personal data or secrets into logs |
| `@EqualsAndHashCode` on future JPA entities with relations | Recursion / broken hash sets |
| `@ToString` on future JPA entities with lazy relations | Triggers lazy loading outside transaction |
