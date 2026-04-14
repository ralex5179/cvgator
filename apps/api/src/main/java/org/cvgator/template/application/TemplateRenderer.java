package org.cvgator.template.application;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
public class TemplateRenderer {

    public String render(String template, Map<String, Object> rootContext) {
        List<Object> contexts = new ArrayList<>();
        contexts.add(rootContext);
        return renderBlock(template, contexts);
    }

    private String renderBlock(String template, List<Object> contexts) {
        StringBuilder output = new StringBuilder();
        int index = 0;

        while (index < template.length()) {
            int tagStart = template.indexOf("{{", index);
            if (tagStart < 0) {
                output.append(template.substring(index));
                break;
            }

            output.append(template, index, tagStart);

            int tagEnd = template.indexOf("}}", tagStart);
            if (tagEnd < 0) {
                throw new IllegalStateException("Unclosed template tag");
            }

            String tag = template.substring(tagStart + 2, tagEnd).trim();
            if (tag.startsWith("#")) {
                String sectionName = tag.substring(1).trim();
                Section section = extractSection(template, tagEnd + 2, sectionName);
                output.append(renderSection(sectionName, section.body(), contexts));
                index = section.nextIndex();
                continue;
            }

            if (tag.startsWith("/")) {
                throw new IllegalStateException("Unexpected section closing tag");
            }

            Object value = resolveValue(tag, contexts);
            output.append(value == null ? "" : HtmlUtils.htmlEscape(String.valueOf(value)));
            index = tagEnd + 2;
        }

        return output.toString();
    }

    private String renderSection(String sectionName, String body, List<Object> contexts) {
        Object value = resolveValue(sectionName, contexts);
        if (value == null) {
            return "";
        }

        if (value instanceof Collection<?> collection) {
            StringBuilder output = new StringBuilder();
            for (Object item : collection) {
                output.append(renderWithContext(body, contexts, item));
            }
            return output.toString();
        }

        if (value instanceof Boolean booleanValue) {
            return booleanValue ? renderBlock(body, contexts) : "";
        }

        if (value instanceof String stringValue) {
            return stringValue.isBlank() ? "" : renderWithContext(body, contexts, value);
        }

        return renderWithContext(body, contexts, value);
    }

    private String renderWithContext(String body, List<Object> contexts, Object value) {
        List<Object> nestedContexts = new ArrayList<>(contexts);
        nestedContexts.add(0, value);
        return renderBlock(body, nestedContexts);
    }

    private Object resolveValue(String path, List<Object> contexts) {
        if (".".equals(path)) {
            return contexts.getFirst();
        }

        for (Object context : contexts) {
            Object resolved = resolveFromContext(context, path);
            if (resolved != UnresolvedValue.INSTANCE) {
                return resolved;
            }
        }

        return null;
    }

    private Object resolveFromContext(Object context, String path) {
        if (context == null) {
            return UnresolvedValue.INSTANCE;
        }

        if (".".equals(path)) {
            return context;
        }

        Object current = context;
        for (String part : path.split("\\.")) {
            if (current instanceof Map<?, ?> map) {
                if (!map.containsKey(part)) {
                    return UnresolvedValue.INSTANCE;
                }
                current = map.get(part);
                continue;
            }

            return UnresolvedValue.INSTANCE;
        }

        return current;
    }

    private Section extractSection(String template, int bodyStartIndex, String sectionName) {
        int searchIndex = bodyStartIndex;
        int depth = 1;

        while (searchIndex < template.length()) {
            int nextTagStart = template.indexOf("{{", searchIndex);
            if (nextTagStart < 0) {
                break;
            }

            int nextTagEnd = template.indexOf("}}", nextTagStart);
            if (nextTagEnd < 0) {
                break;
            }

            String nestedTag = template.substring(nextTagStart + 2, nextTagEnd).trim();
            if (nestedTag.equals("#" + sectionName)) {
                depth++;
            } else if (nestedTag.equals("/" + sectionName)) {
                depth--;
                if (depth == 0) {
                    return new Section(template.substring(bodyStartIndex, nextTagStart), nextTagEnd + 2);
                }
            }

            searchIndex = nextTagEnd + 2;
        }

        throw new IllegalStateException("Unclosed section " + sectionName);
    }

    private enum UnresolvedValue {
        INSTANCE
    }

    private record Section(String body, int nextIndex) {
    }
}
