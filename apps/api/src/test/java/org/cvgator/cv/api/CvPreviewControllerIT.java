package org.cvgator.cv.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CvPreviewControllerIT {

    @LocalServerPort
    private int port;

    @Test
    void previewReturnsRenderedHtml() throws Exception {
        HttpResponse<String> response = postJson("/api/cv/preview", """
                {
                  "templateId": "default",
                  "personal": {
                    "fullName": "Jane Doe",
                    "title": "Senior Software Engineer",
                    "email": "jane@example.com",
                    "phone": "+33 6 00 00 00 00",
                    "location": "Paris, France",
                    "summary": "Builds reliable backend systems."
                  },
                  "experience": [
                    {
                      "role": "Platform Engineer",
                      "company": "Acme",
                      "location": "Paris, France",
                      "startDate": "2022",
                      "endDate": "Present",
                      "highlights": ["Led API delivery", "Improved deployment safety"]
                    }
                  ],
                  "education": [
                    {
                      "degree": "MSc Computer Science",
                      "institution": "Example University",
                      "location": "Lyon, France",
                      "startDate": "2018",
                      "endDate": "2020"
                    }
                  ],
                  "skills": [
                    { "name": "Java" },
                    { "name": "Spring Boot" }
                  ]
                }
                """);

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("content-type"))
                .hasValueSatisfying(value -> assertThat(value).contains("text/html"));
        assertThat(response.body()).contains("Jane Doe");
        assertThat(response.body()).contains("Platform Engineer");
        assertThat(response.body()).contains("<style>");
        assertThat(response.body()).doesNotContain("{{personal.fullName}}");
    }

    @Test
    void previewEscapesUserContent() throws Exception {
        HttpResponse<String> response = postJson("/api/cv/preview", """
                {
                  "templateId": "default",
                  "personal": {
                    "fullName": "<script>alert('x')</script>",
                    "title": "Engineer",
                    "email": "jane@example.com",
                    "phone": "+33 6 00 00 00 00",
                    "location": "Paris, France",
                    "summary": "Works on backend"
                  },
                  "experience": [],
                  "education": [],
                  "skills": []
                }
                """);

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
        assertThat(response.body()).doesNotContain("<script>alert('x')</script>");
    }

    @Test
    void previewRejectsUnknownTemplateId() throws Exception {
        HttpResponse<String> response = postJson("/api/cv/preview", """
                {
                  "templateId": "missing",
                  "personal": {
                    "fullName": "Jane Doe",
                    "title": "Engineer",
                    "email": "jane@example.com",
                    "phone": "+33 6 00 00 00 00",
                    "location": "Paris, France"
                  },
                  "experience": [],
                  "education": [],
                  "skills": []
                }
                """);

        assertThat(response.statusCode()).isEqualTo(404);
    }

    @Test
    void listsRegisteredTemplatesForFrontend() throws Exception {
        HttpResponse<String> response = get("/api/templates");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"id\":\"default\"");
        assertThat(response.body()).contains("\"displayName\":\"Default\"");
    }

    private HttpResponse<String> get(String path) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .GET()
                .build();

        return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> postJson(String path, String body) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    }
}
