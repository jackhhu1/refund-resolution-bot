/**
 * MeetStream API integration
 * Docs: https://api.meetstream.ai
 */

async function joinMeeting(meetingUrl) {
  if (process.env.MOCK_MODE === 'true') {
    console.log('[meetstream] MOCK: bot joining', meetingUrl);
    return { bot_id: 'mock-bot-123', transcript_id: 'mock-transcript-123' };
  }

  const response = await fetch(
    'https://api.meetstream.ai/api/v1/bots/create_bot',
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.MEETSTREAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meeting_link: meetingUrl,
        video_required: false,
        callback_url: `${process.env.NGROK_URL}/webhook/meetstream`,
        recording_config: {
          transcript: {
            provider: {
              meeting_captions: {}
            }
          }
        }
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`MeetStream joinMeeting failed: ${err}`);
  }

  const data = await response.json();
  console.log('[meetstream] Bot created:', data.bot_id, 'transcript_id:', data.transcript_id);
  return data;
}

async function fetchTranscript(botId, transcriptId) {
  if (process.env.MOCK_MODE === 'true') {
    return 'Agent: I can see your order ORD-8821 for $47. I will process a full refund right away.';
  }

  // meeting_captions: fetch bot detail and get S3 caption link
  const detailRes = await fetch(
    `https://api.meetstream.ai/api/v1/bots/${botId}/detail`,
    {
      headers: {
        'Authorization': `Token ${process.env.MEETSTREAM_API_KEY}`
      }
    }
  );

  if (!detailRes.ok) {
    throw new Error(`Failed to fetch bot detail: ${detailRes.status}`);
  }

  const detail = await detailRes.json();
  console.log('[meetstream] Bot detail:', JSON.stringify(detail).slice(0, 300));

  // Try to get caption S3 link from detail response
  const captionUrl = detail.caption_url 
    ?? detail.captions_url 
    ?? detail.transcript_url
    ?? detail.recording_config?.transcript?.url;

  if (captionUrl) {
    console.log('[meetstream] Fetching captions from S3...');
    const captionRes = await fetch(captionUrl);
    const text = await captionRes.text();
    console.log('[meetstream] Captions fetched:', text.slice(0, 200));
    return text;
  }

  // Fallback: if transcript_id exists try standard endpoint
  if (transcriptId && transcriptId !== 'mock-transcript-123') {
    const transcriptRes = await fetch(
      `https://api.meetstream.ai/api/v1/transcript/${transcriptId}/get_transcript`,
      {
        headers: {
          'Authorization': `Token ${process.env.MEETSTREAM_API_KEY}`
        }
      }
    );
    const data = await transcriptRes.json();
    console.log('[meetstream] Transcript data:', JSON.stringify(data).slice(0, 300));
    return data.transcript ?? data.text ?? JSON.stringify(data);
  }

  throw new Error('No transcript or caption URL available');
}

module.exports = { joinMeeting, fetchTranscript };
