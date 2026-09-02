// Zoom Server-to-Server OAuth entegrasyonu.
// Ortam değişkenleri (.env): ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
// Zoom Marketplace'te "Server-to-Server OAuth" app oluşturup meeting:write
// kapsamını (scope) eklemeniz gerekir.

async function getZoomAccessToken() {
  const basic = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64");

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } }
  );

  if (!res.ok) throw new Error("Zoom token alınamadı.");
  const data = await res.json();
  return data.access_token as string;
}

export async function createZoomMeeting({
  topic,
  startTimeISO,
  durationMinutes,
}: {
  topic: string;
  startTimeISO: string;
  durationMinutes: number;
}) {
  // Zoom kimlik bilgileri tanımlı değilse (geliştirme ortamı) sahte bir link
  // döner — akışın Zoom olmadan da test edilebilmesi için.
  if (!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
    const fakeId = Math.floor(1000000000 + Math.random() * 8999999999);
    return {
      id: String(fakeId),
      join_url: `https://zoom.us/j/${fakeId}`,
      start_url: `https://zoom.us/s/${fakeId}`,
    };
  }

  const token = await getZoomAccessToken();
  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      type: 2, // zamanlanmış toplantı
      start_time: startTimeISO,
      duration: durationMinutes,
      timezone: "Europe/Istanbul",
      settings: { join_before_host: false, waiting_room: true },
    }),
  });

  if (!res.ok) throw new Error("Zoom toplantısı oluşturulamadı.");
  const data = await res.json();
  return { id: String(data.id), join_url: data.join_url as string, start_url: data.start_url as string };
}
