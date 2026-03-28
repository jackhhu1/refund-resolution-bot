async function executeAuthorized(amount, customerId, agentId, callId) {
  console.log("executeAuthorized called");
  if (process.env.MOCK_MODE === 'true') {
    const msg = `MOCK: Stripe refund of $${amount} fired for ${customerId}`;
    console.log(msg);
    return msg;
  }
}

async function executeEscalation(amount, customerId, reason, transcript, limit) {
  console.log("executeEscalation called");
  if (process.env.MOCK_MODE === 'true') {
    const msg = `MOCK: Jira ticket created for $${amount} refund — ${reason}`;
    console.log(msg);
    return msg;
  }
}

async function executeFlag(reason, callId) {
  console.log("executeFlag called");
  if (process.env.MOCK_MODE === 'true') {
    const msg = `MOCK: Discrepancy flagged — ${reason}`;
    console.log(msg);
    return msg;
  }
  console.log(`REAL: Creating Jira ticket. Priority: High, Label: policy-violation, Reason: ${reason}`);
}

module.exports = { executeAuthorized, executeEscalation, executeFlag };
