// One source of truth for how a raw topic key is shown to readers, so the same
// topic never wears two labels across the page. Sentence case throughout, with
// explicit overrides for acronyms and friendlier phrasing.
const TOPIC_LABELS: Record<string, string> = {
  failed_transaction: "Failed transactions",
  competitor: "Competitor",
  cashback_offer: "Cashback offers",
  recharge: "Recharge",
  send_money: "Send money",
  charges_fees: "Charges & fees",
  agent_network: "Agent network",
  bill_payment: "Bill payment",
  feature_query: "Feature queries",
  customer_care: "Customer care",
  login_otp: "Login / OTP",
  app_crash: "App crashes",
  app_experience: "App experience",
  product_news: "Product news",
};

export function topicLabel(topic: string): string {
  return (
    TOPIC_LABELS[topic] ??
    topic.charAt(0).toUpperCase() + topic.slice(1).replaceAll("_", " ")
  );
}
