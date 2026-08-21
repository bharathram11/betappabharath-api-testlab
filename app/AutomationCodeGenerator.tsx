"use client";

import { useMemo, useState } from "react";
import type { InspectorData } from "./LearningTools";

type Language = "restassured" | "playwright";
type Artifact = "test" | "request-pojo" | "response-pojo";
type PojoStyle = "plain" | "lombok";
type Props = { data: InspectorData | null; responseData: unknown; requestName: string; expectedStatus: number; expectedField: string };

const javaReserved = new Set(["abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float", "for", "goto", "if", "implements", "import", "instanceof", "int", "interface", "long", "native", "new", "package", "private", "protected", "public", "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile", "while"]);

function splitUrl(rawUrl: string) {
  const fallbackOrigin = typeof window === "undefined" ? "https://betappabharath-api-testlab.bharathbetappa.workers.dev" : window.location.origin;
  const parsed = new URL(rawUrl, fallbackOrigin);
  return { baseUrl: parsed.origin, path: `${parsed.pathname}${parsed.search}` };
}

function safeJavaName(value: string) {
  const words = value.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/);
  const name = words.map((word, index) => index ? `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}` : word.toLowerCase()).join("");
  return name && /^[a-zA-Z_]/.test(name) ? name : "generatedApiTest";
}

function pascalCase(value: string) {
  const name = value.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean).map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`).join("");
  return name && /^[A-Za-z_]/.test(name) ? name : "Generated";
}

function javaFieldName(value: string) {
  const name = safeJavaName(value);
  return javaReserved.has(name) ? `${name}Value` : name;
}

function safeTestTitle(value: string) { return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'"); }

function optionalChain(path: string) {
  return path.split(".").filter(Boolean).map((part) => /^[A-Za-z_$][\w$]*$/.test(part) ? `?.${part}` : `?.[${JSON.stringify(part)}]`).join("");
}

function formattedJson(raw?: string) {
  if (!raw?.trim()) return "";
  try { return JSON.stringify(JSON.parse(raw), null, 2); }
  catch { return raw.trim(); }
}

function parseJson(raw?: string) {
  if (!raw?.trim()) return null;
  try { return JSON.parse(raw) as unknown; }
  catch { return null; }
}

function javaCode(data: InspectorData, requestName: string, expectedStatus: number, expectedField: string) {
  const { baseUrl, path } = splitUrl(data.url);
  const method = data.method.toLowerCase();
  const body = formattedJson(data.requestBody);
  const protectedRequest = Boolean(data.requestHeaders.Authorization);
  const authLine = protectedRequest ? '        .header("Authorization", "Bearer " + accessToken)\n' : "";
  const tokenLine = protectedRequest ? '    String accessToken = System.getenv("ACCESS_TOKEN");\n\n' : "";
  const bodyLines = body ? `        .contentType(ContentType.JSON)\n        .body("""\n${body}\n        """)\n` : "";
  const fieldAssertion = expectedField && expectedStatus !== 204 ? `\n        .body("${expectedField.replaceAll('"', '\\"')}", notNullValue())` : "";

  return `import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;

class BankingApiTest {

  @Test
  void ${safeJavaName(requestName)}() {
    String baseUrl = "${baseUrl}";
${tokenLine}    given()
        .baseUri(baseUrl)
${authLine}        .header("Accept", "application/json")
${bodyLines}    .when()
        .${method}("${path.replaceAll('"', '\\"')}")
    .then()
        .statusCode(${expectedStatus})${fieldAssertion};
  }
}`;
}

function playwrightCode(data: InspectorData, requestName: string, expectedStatus: number, expectedField: string) {
  const { baseUrl, path } = splitUrl(data.url);
  const method = data.method.toLowerCase();
  const body = formattedJson(data.requestBody);
  const protectedRequest = Boolean(data.requestHeaders.Authorization);
  const tokenLine = protectedRequest ? "  const accessToken = process.env.ACCESS_TOKEN ?? '';\n" : "";
  const authHeader = protectedRequest ? "\n      Authorization: `Bearer ${accessToken}`," : "";
  const requestBody = body ? `,\n    data: ${body.split("\n").join("\n    ")}` : "";
  const responseAssertion = expectedField && expectedStatus !== 204 ? `\n  const responseBody = await response.json();\n  expect(responseBody${optionalChain(expectedField)}).toBeDefined();` : "";

  return `import { test, expect } from '@playwright/test';

test('${safeTestTitle(requestName)}', async ({ request }) => {
  const baseURL = '${baseUrl}';
${tokenLine}  const response = await request.${method}(\`${"${baseURL}"}${path.replaceAll("`", "\\`")}\`, {
    headers: {
      Accept: 'application/json',${authHeader}
    }${requestBody}
  });

  expect(response.status()).toBe(${expectedStatus});${responseAssertion}
});`;
}

function objectValue(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return { value };
}

function pojoCode(value: unknown, className: string, style: PojoStyle) {
  if (value === null || value === undefined) return `// No JSON body was available to generate ${className}.\n// Send a request with a body or choose a response containing JSON.`;
  const root = objectValue(value);
  let usesList = false;
  let usesJsonProperty = false;

  function typeFor(fieldValue: unknown, key: string): string {
    if (Array.isArray(fieldValue)) {
      usesList = true;
      if (!fieldValue.length) return "List<Object>";
      const first = fieldValue[0];
      return `List<${first && typeof first === "object" && !Array.isArray(first) ? pascalCase(key.replace(/s$/i, "") || "Item") : typeFor(first, `${key}Item`)}>`;
    }
    if (fieldValue && typeof fieldValue === "object") return pascalCase(key);
    if (typeof fieldValue === "boolean") return "Boolean";
    if (typeof fieldValue === "number") return Number.isInteger(fieldValue) ? "Integer" : "Double";
    if (typeof fieldValue === "string") return "String";
    return "Object";
  }

  function renderClass(record: Record<string, unknown>, name: string, nested: boolean, indent = ""): string {
    const fields = Object.entries(record);
    const fieldDetails = fields.map(([jsonName, fieldValue]) => {
      const fieldName = javaFieldName(jsonName);
      if (fieldName !== jsonName) usesJsonProperty = true;
      return { jsonName, fieldName, fieldValue, type: typeFor(fieldValue, jsonName) };
    });
    const annotation = style === "lombok" ? `${indent}@Data\n${indent}@NoArgsConstructor\n${indent}@AllArgsConstructor\n` : "";
    const declaration = `${indent}public ${nested ? "static " : ""}class ${name} {\n`;
    const fieldCode = fieldDetails.map(({ jsonName, fieldName, type }) => {
      const jsonAnnotation = fieldName !== jsonName ? `${indent}  @JsonProperty("${jsonName.replaceAll('"', '\\"')}")\n` : "";
      return `${jsonAnnotation}${indent}  private ${type} ${fieldName};`;
    }).join("\n");
    const constructors = style === "plain" ? `\n\n${indent}  public ${name}() {\n${indent}  }\n` : "";
    const accessors = style === "plain" ? fieldDetails.map(({ fieldName, type }) => {
      const title = `${fieldName[0]?.toUpperCase() ?? ""}${fieldName.slice(1)}`;
      return `\n${indent}  public ${type} get${title}() {\n${indent}    return ${fieldName};\n${indent}  }\n\n${indent}  public void set${title}(${type} ${fieldName}) {\n${indent}    this.${fieldName} = ${fieldName};\n${indent}  }`;
    }).join("") : "";
    const nestedClasses = fieldDetails.flatMap(({ jsonName, fieldValue }) => {
      if (Array.isArray(fieldValue) && fieldValue[0] && typeof fieldValue[0] === "object" && !Array.isArray(fieldValue[0])) return [renderClass(fieldValue[0] as Record<string, unknown>, pascalCase(jsonName.replace(/s$/i, "") || "Item"), true, `${indent}  `)];
      if (fieldValue && typeof fieldValue === "object" && !Array.isArray(fieldValue)) return [renderClass(fieldValue as Record<string, unknown>, pascalCase(jsonName), true, `${indent}  `)];
      return [];
    });
    const nestedCode = nestedClasses.length ? `\n\n${nestedClasses.join("\n\n")}\n` : "\n";
    return `${annotation}${declaration}${fieldCode}${constructors}${accessors}${nestedCode}${indent}}`;
  }

  const classBody = renderClass(root, className, false);
  const imports = [
    usesJsonProperty ? "import com.fasterxml.jackson.annotation.JsonProperty;" : "",
    usesList ? "import java.util.List;" : "",
    style === "lombok" ? "import lombok.AllArgsConstructor;\nimport lombok.Data;\nimport lombok.NoArgsConstructor;" : "",
  ].filter(Boolean).join("\n");
  return `${imports}${imports ? "\n\n" : ""}${classBody}`;
}

export default function AutomationCodeGenerator({ data, responseData, requestName, expectedStatus, expectedField }: Props) {
  const [language, setLanguage] = useState<Language>("restassured");
  const [artifact, setArtifact] = useState<Artifact>("test");
  const [pojoStyle, setPojoStyle] = useState<PojoStyle>("plain");
  const [copied, setCopied] = useState(false);
  const requestClassName = `${pascalCase(requestName)}Request`;
  const responseClassName = `${pascalCase(requestName)}Response`;
  const testCode = useMemo(() => !data ? "" : language === "restassured" ? javaCode(data, requestName, expectedStatus, expectedField) : playwrightCode(data, requestName, expectedStatus, expectedField), [data, requestName, expectedStatus, expectedField, language]);
  const requestPojo = useMemo(() => pojoCode(parseJson(data?.requestBody), requestClassName, pojoStyle), [data?.requestBody, requestClassName, pojoStyle]);
  const responsePojo = useMemo(() => pojoCode(responseData, responseClassName, pojoStyle), [responseData, responseClassName, pojoStyle]);
  const code = language === "playwright" || artifact === "test" ? testCode : artifact === "request-pojo" ? requestPojo : responsePojo;
  const filename = language === "playwright" ? "banking-api.spec.ts" : artifact === "test" ? "BankingApiTest.java" : artifact === "request-pojo" ? `${requestClassName}.java` : `${responseClassName}.java`;

  async function copyCode() {
    if (!code) return;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(code);
      else {
        const helper = document.createElement("textarea");
        helper.value = code;
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  }

  function downloadCode() {
    if (!code) return;
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function selectLanguage(next: Language) {
    setLanguage(next);
    setArtifact("test");
    setCopied(false);
  }

  return <section id="automation" className="automation-code-generator" style={{ order: 9 }}>
    <div className="automation-heading"><div><p className="eyebrow">From request to automation</p><h2>Generate tests and Java POJOs</h2><p>Send a request, then generate an automation test plus request and response model classes from the actual JSON.</p></div><div className="automation-tabs" role="tablist" aria-label="Automation framework"><button type="button" className={language === "restassured" ? "active" : ""} onClick={() => selectLanguage("restassured")}>Rest Assured · Java</button><button type="button" className={language === "playwright" ? "active" : ""} onClick={() => selectLanguage("playwright")}>Playwright · TypeScript</button></div></div>
    {data ? <><div className="automation-artifact-bar"><div role="tablist" aria-label="Generated code type"><button type="button" className={artifact === "test" ? "active" : ""} onClick={() => setArtifact("test")}>Automation test</button>{language === "restassured" && <><button type="button" className={artifact === "request-pojo" ? "active" : ""} onClick={() => setArtifact("request-pojo")}>Request POJO</button><button type="button" className={artifact === "response-pojo" ? "active" : ""} onClick={() => setArtifact("response-pojo")}>Response POJO</button></>}</div>{language === "restassured" && artifact !== "test" && <label>POJO style<select value={pojoStyle} onChange={(event) => setPojoStyle(event.target.value as PojoStyle)}><option value="plain">Plain Java</option><option value="lombok">Lombok</option></select></label>}</div><div className="automation-workspace"><div className="automation-meta"><span><b>{data.method}</b>{new URL(data.url).pathname}</span><span>Expected status: <b>{expectedStatus}</b></span><span>{artifact === "test" ? "Real token replaced with ACCESS_TOKEN" : "Generated from current JSON"}</span></div><div className="automation-code-head"><div><b>{filename}</b><span>{language === "restassured" ? artifact === "test" ? "Java 17+ · JUnit 5 · REST Assured" : `${pojoStyle === "plain" ? "Getters and setters" : "Lombok annotations"} · Jackson-ready` : "Playwright Test · TypeScript"}</span></div><div><button type="button" onClick={copyCode}>{copied ? "Copied!" : "Copy code"}</button><button type="button" onClick={downloadCode}>Download</button></div></div><pre><code>{code}</code></pre><p className="automation-note"><b>{artifact === "test" ? "Safe by default:" : "Generated model:"}</b> {artifact === "test" ? <>the generated test never contains your real token. Set an <code>ACCESS_TOKEN</code> environment variable for protected requests.</> : <>JSON names such as <code>expires_in</code> are mapped safely with Jackson, and nested JSON creates nested Java classes.</>}</p></div></> : <div className="automation-empty"><span>&lt;/&gt;</span><b>No code generated yet</b><p>Choose an operation in the practice area and click Send. The test and matching POJO classes will be generated automatically.</p></div>}
    {data && <details className="automation-setup"><summary>How do I run this generated test?</summary>{language === "restassured" ? <div><b>Rest Assured and POJO setup</b><ol><li>Use a Java 17 or newer Maven test project.</li><li>Add JUnit 5, REST Assured, Jackson, and Lombok only if you select the Lombok style.</li><li>Save the test under <code>src/test/java</code> and each POJO in its own matching <code>.java</code> file.</li><li>Set <code>ACCESS_TOKEN</code>, then run the JUnit test.</li></ol></div> : <div><b>Playwright setup</b><ol><li>Create a Playwright project with <code>npm init playwright@latest</code>.</li><li>Save the code as <code>banking-api.spec.ts</code> inside the <code>tests</code> folder.</li><li>Set <code>ACCESS_TOKEN</code>.</li><li>Run <code>npx playwright test banking-api.spec.ts</code>.</li></ol></div>}</details>}
  </section>;
}
