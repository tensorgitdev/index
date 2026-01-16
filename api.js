async function submitGuestbook(message, emoji) {
  const res = await fetch(
    "https://mqruxlhrxniyzbhkhmtc.supabase.co/functions/v1/smart-function",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcnV4bGhyeG5peXpiaGtobXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjgzMDIsImV4cCI6MjA4MzkwNDMwMn0.qPt-dN4Uj0d0pKU11AYy782XMuoXeJ7CFiVXmEyrJzA"
      },
      body: JSON.stringify({ message, emoji })
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error:", errorText);
    throw new Error("request failed");
  }

  return await res.json();
}

async function logVisit() {
  try {
    const response = await fetch('https://mqruxlhrxniyzbhkhmtc.supabase.co/functions/v1/swift-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcnV4bGhyeG5peXpiaGtobXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjgzMDIsImV4cCI6MjA4MzkwNDMwMn0.qPt-dN4Uj0d0pKU11AYy782XMuoXeJ7CFiVXmEyrJzA"
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      console.error('Failed to log visit');
      return;
    }

    const data = await response.json();
    // console.log('Visit logged:', data);
  } catch (error) {
    console.error('Error logging visit:', error);
  }
}