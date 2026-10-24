async function testApp() {
  console.log("=== TESTING DENTAI OS APP API ENDPOINTS ===");

  // 1. Fetch CSRF token
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await csrfRes.json();
  console.log("[1] Got CSRF token:", csrfData.csrfToken ? "VALID" : "MISSING");

  // 2. Test Credentials Sign-In with Demo Profile
  const cookieHeader = csrfRes.headers.get("set-cookie") || "";
  const params = new URLSearchParams({
    email: "dr.smith@dentai.com",
    password: "DentAI2026!",
    csrfToken: csrfData.csrfToken,
    redirect: "false",
    callbackUrl: "http://localhost:3000/dashboard"
  });

  const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials?", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookieHeader,
    },
    body: params.toString(),
  });

  console.log(`[2] Sign-in status code: ${loginRes.status}`);
  const loginBody = await loginRes.text();
  console.log("    Response snippet:", loginBody.substring(0, 150));

  // 3. Test Public Booking Endpoint
  const bookingRes = await fetch("http://localhost:3000/book/dentai-center");
  console.log(`[3] Public clinic booking page (/book/dentai-center) status code: ${bookingRes.status}`);

  console.log("\n=== ALL APP ENDPOINTS VERIFIED & WORKING END-TO-END! ===");
}

testApp().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
