import { Reverb } from "../../../dist/index.js";

async function main() {
  const token = process.env.REVERB_TOKEN;
  if (!token) {
    console.error("Set REVERB_TOKEN in your environment.");
    process.exit(1);
  }

  const client = new Reverb({ token, baseUrl: "https://sandbox.reverb.com/api" });

  const me = await client.getMyAccount();
  console.log("Account:", me);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
