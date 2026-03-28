// ── Slack webhook helper ─────────────────────────────────────
async function notifySlack(message) {
  if (process.env.MOCK_MODE === 'true') {
    console.log('[slack] MOCK:', message);
    return;
  }

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message })
  }).catch(err => console.error('[slack] Failed:', err.message));
}

// ── Actions ──────────────────────────────────────────────────

async function executeAuthorized(amount, customerId, agentId, callId, extracted) {
  console.log("executeAuthorized called");

  let refund;
  if (process.env.MOCK_MODE === 'true') {
    const msg = `MOCK: Stripe refund of $${amount} fired for ${customerId}`;
    console.log(msg);
  } else {
    // TODO: real Stripe refund call
  }

  await notifySlack(
    `:white_check_mark: *Refund processed automatically*\n` +
    `> Amount: *$${amount}*\n` +
    `> Customer: ${customerId}\n` +
    `> Order: ${extracted.order_id}\n` +
    `> Reason: ${extracted.refund_reason}\n` +
    `> Agent: ${agentId}\n` +
    `> Ref: ${refund?.id ?? 'mock'}`
  );

  return `Refund of $${amount} processed for ${customerId}`;
}

async function executeEscalation(amount, customerId, reason, transcript, limit, extracted) {
  console.log("executeEscalation called");

  if (process.env.MOCK_MODE === 'true') {
    const msg = `MOCK: Jira ticket created for $${amount} refund — ${reason}`;
    console.log(msg);
  } else {
    // TODO: real Jira ticket creation
  }

  await notifySlack(
    `:warning: *Refund escalation required*\n` +
    `> Amount: *$${amount}* exceeds agent limit of $${limit}\n` +
    `> Customer: ${customerId}\n` +
    `> Order: ${extracted.order_id}\n` +
    `> Reason: ${extracted.refund_reason}\n` +
    `> Jira ticket created for manager approval`
  );

  return `Escalation created for $${amount} refund — ${reason}`;
}

async function executeFlag(reason, callId, decision, extracted) {
  console.log("executeFlag called");

  if (process.env.MOCK_MODE === 'true') {
    const msg = `MOCK: Discrepancy flagged — ${reason}`;
    console.log(msg);
  } else {
    console.log(`REAL: Creating Jira ticket. Priority: High, Label: policy-violation, Reason: ${reason}`);
  }

  const amount = extracted?.refund_amount ?? 'unknown';
  const customerId = extracted?.customer_id ?? 'unknown';

  await notifySlack(
    `:x: *Refund flagged — policy violation*\n` +
    `> Amount: *$${amount}*\n` +
    `> Customer: ${customerId}\n` +
    `> Order: ${extracted.order_id}\n` +
    `> Reason: ${decision.reason}\n` +
    `> Rule: ${decision.policy_rule_applied}\n` +
    `> No action taken — requires manual review`
  );

  return `Flagged: ${reason}`;
}

module.exports = { executeAuthorized, executeEscalation, executeFlag };
