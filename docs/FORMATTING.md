# Code Formatting

CVGator enforces consistent formatting using:

- an **Eclipse formatter profile** stored in the repository at `tools/format/formatter.xml`
- the **Spotless Gradle plugin**, which applies the formatter profile during the build
- a frontend formatting decision for React + TypeScript + Vite that is still pending

Formatting is automatically verified during every build. A build will fail if any source file
does not conform to the formatter profile.

---

## Formatter Configuration

The canonical formatter file is:

```
tools/format/formatter.xml
```

This file is the single source of truth for all formatting rules. The main choices are:

| Rule | Value |
|---|---|
| Indentation style | Spaces only (no tabs) |
| Indentation size | 4 spaces |
| Continuation indentation | 2 spaces (improves readability of lambdas and builder chains) |
| Maximum line length | 120 characters |
| Comment line length | 120 characters |

Additional wrapping improvements are configured for:

- **Java annotations with many attributes** - each attribute wraps onto its own line when the
  annotation is too long to fit on one line
- **Annotation arrays** - each element in the
  array is placed on its own line
- **Fluent method chains** - each chained call wraps onto its own line when the chain exceeds
  the line length limit

The formatter also fully supports the standard escape hatch:

```java
// @formatter:off
// @formatter:on
```

> **Architecture note:** `tools/format/formatter.xml` is part of the project's architecture
> constraints. Do not modify it casually. Changes to the formatter profile affect every
> source file in the repository and must be agreed upon by the team.

---

## Spotless Integration

Formatting is enforced via the Spotless Gradle plugin. Two tasks are available:

**Check formatting (read-only - fails if any file is out of format):**

```bash
./gradlew spotlessCheck
```

**Automatically reformat all source files:**

```bash
./gradlew spotlessApply
```

The following tasks also enforce formatting and will fail on violations:

```bash
./gradlew build
./gradlew check
```

The recommended workflow before opening a PR is to run `./gradlew spotlessApply` once to ensure
all files are correctly formatted, then verify with `./gradlew spotlessCheck`.

---

## Frontend Formatting

Frontend formatting is not finalized yet. Before enforcing checks for `apps/web`, decide whether
CVGator should use:

- Prettier for formatting and ESLint for code quality.
- ESLint formatting rules only.
- Vite's default linting/formatting setup plus npm scripts.
- No frontend formatting enforcement during the first MVP slice.

Once decided, document the npm scripts here, for example:

```bash
npm run format
npm run lint
```

---

## Importing the Formatter in IntelliJ IDEA

To make IntelliJ's **Reformat Code** action produce output that matches the Spotless check,
import the formatter profile:

1. Open **Settings / Preferences** (`Ctrl+Alt+S` on Windows/Linux, `Cmd+,` on macOS)
2. Navigate to **Editor > Code Style > Java**
3. Click the **gear icon** next to the scheme name dropdown
4. Choose **Import Scheme > Eclipse XML Profile**
5. Select the file:
   ```
   tools/format/formatter.xml
   ```
6. Name the scheme (e.g. `cvgator`) and click **OK**
7. Click **Apply**

After importing, run **Code > Reformat Code** (`Ctrl+Alt+L` on Windows/Linux,
`Cmd+Option+L` on macOS) on any files you have open to apply the new scheme immediately.

---

## Optional: Format on Save

To have IntelliJ reformat files automatically every time you save, enable:

**Settings / Preferences > Tools > Actions on Save > Reformat Code**

This ensures your files are always formatted before you run the build, preventing Spotless
check failures caused by editor output.

---

## Formatter Escape Hatch

Use `@formatter:off` / `@formatter:on` sparingly, only when the formatter produces output
that is genuinely harder to read than the manually formatted version. Typical cases include
generated snippets, carefully aligned examples, or complex annotation blocks.

```java
// @formatter:off
private static final String TEMPLATE_PREVIEW_SAMPLE = """
    <section class="cv-header">
      <h1>Jane Example</h1>
      <p>Product Engineer</p>
    </section>
    """;
// @formatter:on
```

Spotless respects these markers and will not reformat the enclosed block.

---

## Troubleshooting

### Build fails with a Spotless formatting violation

```
> Task :spotlessCheck FAILED
> The following files had format violations:
    apps/api/src/main/java/<package-path>/cv/api/CvRenderController.java
```

**Fix:** Run `./gradlew spotlessApply` to automatically reformat all affected files, then
re-run the build.

### IntelliJ is inserting tabs instead of spaces

The formatter profile enforces spaces-only indentation. If IntelliJ is inserting tabs, verify
that the `cvgator` scheme is selected under **Editor > Code Style > Java** and that
**Use tab character** is unchecked. Importing the formatter profile (see above) sets this
correctly.

### Line endings

If the repository has a `.gitattributes` file that enforces LF line endings, ensure your
editor and Git client are configured to check out and commit LF files. On Windows, set:

```bash
git config core.autocrlf input
```

Spotless will report CRLF line endings as a formatting violation.
