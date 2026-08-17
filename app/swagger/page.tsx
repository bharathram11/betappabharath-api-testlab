import SwaggerClient from "./swagger-client";
export default function SwaggerPage() {
  return <>
    <a className="swagger-route-practice" href="/#playground">Open Practice Lab</a>
    <SwaggerClient />
  </>;
}
