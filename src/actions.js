async function executeAuthorized(amount, customerId, agentId, callId) {
  console.log("executeAuthorized called");
}

async function executeEscalation(amount, customerId, reason, transcript, limit) {
  console.log("executeEscalation called");
}

module.exports = { executeAuthorized, executeEscalation };
