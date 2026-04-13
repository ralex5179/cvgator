# Sensitive Logging Policy

## Why This Matters

CVGator handles CV data. Even without authentication or a database in the first MVP, request
bodies, rendered HTML, generated PDFs, and local or CI logs may contain personal data. Once
personal data appears in logs, it can be copied into terminal history, Docker logs, CI output,
crash reports, or future log aggregation systems.

| Leak type | Consequence |
|-----------|-------------|
| Full CV JSON | Exposes employment history, education, contact details, and personal profile text |
| Rendered HTML or PDF bytes | Exposes the complete generated CV |
| Email, phone, address, links | PII exposure and unwanted contact or profiling |
| References or referee contact details | Exposes third-party personal data |
| `Authorization`, `Cookie`, or future auth tokens | Account or session compromise if auth is added |
| `apiKey` / `secretKey` | Third-party service compromise |

---

## What Counts As Sensitive

| Category | Examples |
|----------|---------------------|
| CV payloads | `cv`, `cvData`, `resume`, `profile`, `experience`, `education`, `references` |
| Generated documents | `html`, `renderedHtml`, `pdf`, `pdfBytes`, `document`, `downloadUrl` |
| Contact details | `email`, `phone`, `address`, `location`, personal links when not intentionally public |
| Future auth data | `password`, `accessToken`, `refreshToken`, `idToken`, `Authorization`, `Cookie` |
| API material | `apiKey`, `clientSecret`, `secretKey` |

It is usually safe to log operational metadata such as `templateId`, request ids, correlation ids,
HTTP status codes, render duration, and non-sensitive feature flags.

---

## Rules

### Rule 1: Never Log Request Or Response DTOs Directly

Generated `toString()` methods and object logging can expose every field. CVGator DTOs should not
use `@ToString`, but direct object logging is still prohibited because future changes can make the
object sensitive.

```java
// BAD: leaks whatever is in the DTO.
log.info("Render request: {}", request);
log.debug("Render response: {}", response);

// GOOD: log only safe operational metadata.
log.info("Render requested templateId={} correlationId={}", templateId, correlationId);
log.debug("Render finished templateId={} durationMs={}", templateId, durationMs);
```

### Rule 2: Do Not Add `@ToString` To DTOs

Do not add Lombok `@ToString` to request or response DTOs. If a non-DTO class has an approved need
for `@ToString`, exclude sensitive fields explicitly.

```java
@Getter
@Setter
@NoArgsConstructor
public class CvRenderRequestDto {

    private CvDataDto cv;
    private String templateId;
}
```

If an exception is approved for a non-DTO class:

```java
@Getter
@ToString
public class RenderJobDebugView {

    private String templateId;

    @ToString.Exclude
    private String renderedHtml;
}
```

`@ToString.Exclude` is a last-resort safety net. The primary rule remains: do not log sensitive
objects directly.

### Rule 3: Never Log Generated Documents

Rendered HTML and PDF content are the output of the user's CV data. Treat them like the input CV
payload.

```java
// BAD
log.debug("Rendered HTML: {}", renderedHtml);
log.debug("PDF bytes: {}", pdfBytes);

// GOOD
log.debug("Rendered document templateId={} htmlLength={} pdfSizeBytes={}",
    templateId,
    renderedHtml.length(),
    pdfBytes.length);
```

Only log sizes, durations, template ids, and status values.

### Rule 4: Never Log Auth Headers Or Cookies

CVGator does not include auth in the initial MVP, but this rule applies immediately to any HTTP
header logging and future auth work.

```java
// BAD
log.debug("Authorization={}", request.getHeader("Authorization"));
log.debug("Cookie={}", request.getHeader("Cookie"));

// GOOD
log.debug("correlationId={}", request.getHeader("X-Correlation-ID"));
```

### Rule 5: Prefer IDs Over Values

```java
// GOOD
log.info("PDF export requested templateId={} correlationId={}", templateId, correlationId);

// BAD
log.info("PDF export requested for email={} phone={}", email, phone);
```

If a user-facing value must appear in logs to diagnose an issue, mask it first and keep the log at
the narrowest useful level and lifetime.

### Rule 6: Use Redaction Helpers When Introduced

When CVGator adds a redaction utility, use it instead of hand-rolled masking. The package should
follow the final Java package structure.

```java
log.info("Render requested email={}", Redaction.maskEmail(email));
log.warn("Field value={}", Redaction.safe(sensitiveValue));
```

---

## Automated Guard

No logging guard exists yet. If one is added, it should run as part of `./gradlew test` and fail
when:

1. A `log.xxx(...)` call passes a variable with a sensitive name such as `cvData`, `renderedHtml`,
   `pdfBytes`, `email`, `phone`, `address`, `password`, `accessToken`, `refreshToken`, `apiKey`, or
   `secretKey`.
2. A `+` string-concatenation joins a sensitive variable name into a log message.
3. A DTO uses Lombok `@ToString`.
4. A non-DTO class with `@ToString` includes a sensitive field without `@ToString.Exclude`.

To suppress a known-safe false positive, require an inline comment such as `// log-safety-ignore`
and explain why the value is safe.

---

## PR Checklist

Before merging any PR that touches services, controllers, DTOs, rendering, PDF export, or logging:

- [ ] No `log.xxx(request)` or `log.xxx(response)` whole-object logging.
- [ ] No full CV JSON, rendered HTML, or PDF bytes in logs.
- [ ] No direct logging of email, phone, address, references, credentials, tokens, or API keys.
- [ ] No `Authorization` or `Cookie` header values in logs.
- [ ] No DTO uses Lombok `@ToString`.
- [ ] Any approved non-DTO `@ToString` excludes sensitive fields.
- [ ] Tests pass, including any future sensitive logging guard.
