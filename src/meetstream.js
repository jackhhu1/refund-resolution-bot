/**
 * MeetStream API integration
 * Docs: https://api.meetstream.ai
 */

async function joinMeeting(meetingUrl) {
  if (process.env.MOCK_MODE === 'true') {
    console.log('[meetstream] MOCK: bot joining', meetingUrl);
    return { bot_id: 'mock-bot-123', status: 'joining' };
  }

  const response = await fetch('https://api.meetstream.ai/api/v1/bots/create_bot', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.MEETSTREAM_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meeting_link: meetingUrl,
      video_required: false,
      callback_url: `${process.env.NGROK_URL}/webhook/meetstream`
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`MeetStream joinMeeting failed: ${err}`);
  }

  return response.json();
}

async function fetchTranscript(botId) {
  if (process.env.MOCK_MODE === 'true') {
    return `Speaker 0: Hello, thank you for calling customer support. My name is Alex. How can I assist you today?
Speaker 1: Hi Alex, I'm calling about an order I received yesterday. It's completely the wrong item.
Speaker 0: I'm so sorry to hear that. Let me look into this for you. Do you have your order ID?
Speaker 1: Yes, it's ORD-8821.
Speaker 0: Thank you. I see your order ORD-8821 for $47. Since we shipped the wrong item, I can process a full refund for you right away.
Speaker 1: That would be great, thank you.
Speaker 0: I've gone ahead and submitted the refund for $47. It should appear on your original payment method in 3 to 5 business days. Is there anything else I can help with?
Speaker 1: No, that's it. Thanks for sorting it out so quickly.
Speaker 0: You're very welcome. Have a wonderful rest of your day!`;
  }

  const response = await fetch(
    `https://api.meetstream.ai/api/v1/bots/${botId}/transcription`,
    {
      headers: {
        'Authorization': `Token ${process.env.MEETSTREAM_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to fetch transcript: ${response.status} ${err}`);
  }

  const data = await response.json();
  console.log('[meetstream] Raw transcript response:', JSON.stringify(data).slice(0, 200));

  // Handle multiple possible response formats
  if (typeof data === 'string') return data;
  if (data.transcript) return data.transcript;
  if (data.transcription) return data.transcription;
  if (data.text) return data.text;
  if (Array.isArray(data)) {
    return data.map(entry =>
      `${entry.speaker ?? 'Speaker'}: ${entry.text ?? entry.content ?? ''}`
    ).join('\n');
  }

  // Log full response so we can debug if none of the above match
  console.log('[meetstream] Full transcript response:', JSON.stringify(data));
  return JSON.stringify(data);
}

module.exports = { joinMeeting, fetchTranscript };
