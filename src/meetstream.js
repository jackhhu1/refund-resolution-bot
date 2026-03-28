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
    return 'Agent: I can see your order ORD-8821 for $47. I will process a refund right away.';
  }

  const response = await fetch(
    `https://api.meetstream.ai/api/v1/bots/${botId}/transcription`,
    {
      headers: { 'Authorization': `Token ${process.env.MEETSTREAM_API_KEY}` }
    }
  );

  if (!response.ok) throw new Error(`Failed to fetch transcript: ${response.status}`);
  const data = await response.json();
  return data.transcript ?? data.transcription ?? JSON.stringify(data);
}

module.exports = { joinMeeting, fetchTranscript };
