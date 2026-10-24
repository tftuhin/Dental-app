async function testSession() {
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await csrfRes.json();
  const cookies = csrfRes.headers.get("set-cookie") || "";

  const params = new URLSearchParams({
    email: "dr.smith@dentai.com",
    password: "DentAI2026!",
    csrfToken: csrfData.csrfToken,
    redirect: "false",
    callbackUrl: "/dashboard"
  });

  const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookies,
    },
    body: params.toString(),
    redirect: "manual",
  });

  const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get("set-cookie") || ""];
  const cookieJar = setCookies.map(c => c.split(";")[0]).join("; ");
  console.log("Login HTTP Status:", loginRes.status);
  console.log("Session Cookies:", cookieJar);

  // Fetch session with cookie
  const sessionRes = await fetch("http://localhost:3000/api/auth/session", {
    headers: {
      "Cookie": cookieJar,
    }
  });

  const session = await sessionRes.json();
  console.log("Authenticated User Session:", session);
}

testSession().catch(console.error);
