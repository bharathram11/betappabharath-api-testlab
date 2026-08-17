"use client";

import { useMemo, useState } from "react";
import type { InspectorData } from "./LearningTools";

type Language = "restassured" | "playwright";
type Props = { data: InspectorData | null; requestName: string; expectedStatus: number; expectedField: string };

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

function safeTestTitle(value: string) { return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'"); }

function optionalChain(path: string) {
  return path.split(".").filter(Boolean).map((part) => /^[A-Za-z_$][\w$]*$/.test(part) ? `?.${part}` : `?.[${JSON.stringify(part)}]`).join("");
}

function formattedJson(raw?: string) {
  if (!raw?.trim()) return "";
  try { return JSON.stringify(JSON.parse(raw), null, 2); }
  catch { return raw.trim(); }
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

export default function AutomationCodeGenerator({ data, requestName, expectedStatus, expectedField }: Props) {
  const [language, setLanguage] = useState<Language>("restassured");
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => !data ? "" : language === "restassured" ? javaCode(data, requestName, expectedStatus, expectedField) : playwrightCode(data, requestName, expectedStatus, expectedField), [data, requestName, expectedStatus, expectedField, language]);

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
    }
    catch { setCopied(false); }
  }

  return <section id="automation" className="automation-code-generator" style={{ order: 9 }}>
    <div className="automation-heading"><div><p className="eyebrow">From request to automation</p><h2>Generate an API automation test</h2><p>Send a request first, then copy a safe starter test generated from the exact method, URL, body, and expected assertions.</p></div><div className="automation-tabs" role="tablist" aria-label="Automation framework"><button type="button" className={language === "restassured" ? "active" : ""} onClick={() => setLanguage("restassured")}>Rest Assured · Java</button><button type="button" className={language === "playwright" ? "active" : ""} onClick={() => setLanguage("playwright")}>Playwright · TypeScript</button></div></div>
    {data ? <div className="automation-workspace"><div className="automation-meta"><span><b>{data.method}</b>{new URL(data.url).pathname}</span><span>Expected status: <b>{expectedStatus}</b></span><span>Real token replaced with <code>ACCESS_TOKEN</code></span></div><div className="automation-code-head"><div><b>{language === "restassured" ? "BankingApiTest.java" : "banking-api.spec.ts"}</b><span>{language === "restassured" ? "Java 17+ · JUnit 5 · REST Assured" : "Playwright Test · TypeScript"}</span></div><button type="button" onClick={copyCode}>{copied ? "Copied!" : "Copy code"}</button></div><pre><code>{code}</code></pre><p className="automation-note"><b>Safe by default:</b> the generated code never contains your real access token. Set an <code>ACCESS_TOKEN</code> environment variable before running protected requests.</p></div> : <div className="automation-empty"><span>&lt;/&gt;</span><b>No code generated yet</b><p>Choose an operation in the practice area and click Send. This section will build both automation versions automatically.</p></div>}
    {data && <details className="automation-setup"><summary>How do I run this generated test?</summary>{language === "restassured" ? <div><b>Rest Assured setup</b><ol><li>Use a Java 17 or newer Maven test project.</li><li>Add JUnit 5 and REST Assured test dependencies.</li><li>Save the code as <code>BankingApiTest.java</code> under <code>src/test/java</code>.</li><li>Set <code>ACCESS_TOKEN</code>, then run the JUnit test.</li></ol></div> : <div><b>Playwright setup</b><ol><li>Create a Playwright project with <code>npm init playwright@latest</code>.</li><li>Save the code as <code>banking-api.spec.ts</code> inside the <code>tests</code> folder.</li><li>Set <code>ACCESS_TOKEN</code>.</li><li>Run <code>npx playwright test banking-api.spec.ts</code>.</li></ol></div>}</details>}
  </section>;
}
