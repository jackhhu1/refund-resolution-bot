async function parseTranscript(transcript) {
  console.log("parseTranscript called");
  return {
    refund_promised: true,
    refund_amount: 47,
    refund_reason: "wrong item",
    customer_id: "cus_8821",
    sentiment: "negative"
  };
}

module.exports = { parseTranscript };
