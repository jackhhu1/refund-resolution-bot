async function checkAuthorized(agentId, requestedAmount) {
  console.log("checkAuthorized called");
  return {
    authorized: true,
    limit: 100,
    agentId,
    requestedAmount
  };
}

module.exports = { checkAuthorized };
