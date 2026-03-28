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
              assemblyai: {
                speech_models: ['universal-2'],
                language_code: 'en_us',
                speaker_labels: true,
                punctuate: true,
                format_text: true,
                filter_profanity: false
              }
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
  console.log('[meetstream] Full create_bot response:', JSON.stringify(data));
  console.log('[meetstream] Bot created:', data.bot_id, 'transcript_id:', data.transcript_id);
  return data;
}

async function fetchTranscript(botId, transcriptId) {
  if (process.env.MOCK_MODE === 'true') {
    return 'Agent: I can see your order ORD-8821 for $47. I will process a full refund right away.';
  }

  if (!transcriptId) {
    throw new Error('No transcript_id available — transcription may not have been configured');
  }

  // Retry up to 5 times with 3 second gaps
  // AssemblyAI may need a moment after bot.stopped
  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`[meetstream] Fetching transcript attempt ${attempt}/5...`);

    const response = await fetch(
      `https://api.meetstream.ai/api/v1/transcript/${transcriptId}/get_transcript`,
      {
        headers: {
          'Authorization': `Token ${process.env.MEETSTREAM_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.warn(`[meetstream] Transcript fetch failed: ${response.status}`);
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }

    const data = await response.json();
    console.log('[meetstream] Transcript response:', JSON.stringify(data).slice(0, 300));

    // Handle various response shapes
    const text = data.transcript 
      ?? data.text 
      ?? data.transcription
      ?? (Array.isArray(data.utterances) 
          ? data.utterances.map(u => `${u.speaker ?? 'Speaker'}: ${u.text}`).join('\n')
          : null);

    if (text && text.length > 10) {
      console.log(`[meetstream] Got transcript (${text.length} chars)`);
      return text;
    }

    console.log(`[meetstream] Transcript not ready yet, waiting 3s...`);
    await new Promise(r => setTimeout(r, 3000));
  }

  throw new Error('Transcript not ready after 5 attempts');
}

module.exports = { joinMeeting, fetchTranscript };
