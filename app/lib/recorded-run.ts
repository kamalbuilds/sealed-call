/** Devnet demo from sol/projects/sealed-call/demo/devnet-run.json (happy path). */
export const RECORDED_DEVNET_RUN = {
  programId: "JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N",
  call: "HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3",
  caller: "HYfBWQ6J3eLvUVKKXbE7xJoDk6bWquQKvcY8ii7owfwW",
  followerCount: 3,
  revealTx:
    "3TiDGbEQ3DPXqBnT43U8M9PERz514pcqVWxLkM8nwA3asJ2osHMBdPP44E5vCtv9DjCWXkYSx8MAmdVjjbj3bhdJ",
  /** positions close on claim, so the follower fills of the demo run are kept here (scripts/devnet-e2e.ts amounts) */
  followerFills: [
    { who: "8syqd674bQ2wpFfPxhVLa6u7rYLtmtMbUTnB2pwCC8Pm", lamports: 10_000_000 },
    { who: "7m3mfUH6TdVvXKm6z32mrkeUNKbpR5vY1z7V3jrjGzfe", lamports: 8_000_000 },
    { who: "7cCACe63VxDXHsySdZeCEt6qjg9aBwLVDaviw1gA64zx", lamports: 6_000_000 },
  ],
  completedAt: "2026-10-05T09:48:58.000Z",
} as const;

export function explorerDevnetTx(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
