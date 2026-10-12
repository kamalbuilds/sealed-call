/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sealed_call.json`.
 */
export type SealedCall = {
  "address": "JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N",
  "metadata": {
    "name": "sealedCall",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "callerClaim",
      "discriminator": [
        227,
        71,
        162,
        108,
        179,
        197,
        222,
        95
      ],
      "accounts": [
        {
          "name": "caller",
          "writable": true,
          "signer": true,
          "relations": [
            "call"
          ]
        },
        {
          "name": "call",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "call.caller",
                "account": "call"
              },
              {
                "kind": "account",
                "path": "call.call_id",
                "account": "call"
              }
            ]
          }
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "call"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vaultOut",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "callerAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "caller"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "claim",
      "discriminator": [
        62,
        198,
        214,
        193,
        213,
        159,
        108,
        210
      ],
      "accounts": [
        {
          "name": "follower",
          "writable": true,
          "signer": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "call",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "call.caller",
                "account": "call"
              },
              {
                "kind": "account",
                "path": "call.call_id",
                "account": "call"
              }
            ]
          }
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "call"
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "call"
              },
              {
                "kind": "account",
                "path": "follower"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vaultOut",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "followerAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "follower"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "follower",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "call",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "call.caller",
                "account": "call"
              },
              {
                "kind": "account",
                "path": "call.call_id",
                "account": "call"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "call"
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "call"
              },
              {
                "kind": "account",
                "path": "follower"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "expire",
      "discriminator": [
        243,
        83,
        205,
        58,
        57,
        201,
        247,
        146
      ],
      "accounts": [
        {
          "name": "caller",
          "writable": true
        },
        {
          "name": "call",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "call.caller",
                "account": "call"
              },
              {
                "kind": "account",
                "path": "call.call_id",
                "account": "call"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "call"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initConfig",
      "discriminator": [
        23,
        235,
        115,
        232,
        168,
        96,
        1,
        231
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "program",
          "address": "JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N"
        },
        {
          "name": "programData",
          "docs": [
            "Only the program's upgrade authority can create the config, so nobody can front-run the deployer."
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "configParams"
            }
          }
        }
      ]
    },
    {
      "name": "openCall",
      "discriminator": [
        153,
        26,
        89,
        45,
        252,
        243,
        183,
        62
      ],
      "accounts": [
        {
          "name": "caller",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "call",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "caller"
              },
              {
                "kind": "arg",
                "path": "callId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "call"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "callId",
          "type": "u64"
        },
        {
          "name": "commitment",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "revealWindowSecs",
          "type": "i64"
        },
        {
          "name": "callerLockSecs",
          "type": "i64"
        },
        {
          "name": "maxVaultLamports",
          "type": "u64"
        },
        {
          "name": "maxImpactBps",
          "type": "u16"
        },
        {
          "name": "callerStakeLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refund",
      "discriminator": [
        2,
        96,
        183,
        251,
        63,
        208,
        46,
        46
      ],
      "accounts": [
        {
          "name": "follower",
          "writable": true
        },
        {
          "name": "call",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "call.caller",
                "account": "call"
              },
              {
                "kind": "account",
                "path": "call.call_id",
                "account": "call"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "call"
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "call"
              },
              {
                "kind": "account",
                "path": "follower"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "revealAndSwap",
      "discriminator": [
        171,
        39,
        209,
        99,
        33,
        15,
        82,
        135
      ],
      "accounts": [
        {
          "name": "caller",
          "writable": true,
          "signer": true,
          "relations": [
            "call"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "call",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "call.caller",
                "account": "call"
              },
              {
                "kind": "account",
                "path": "call.call_id",
                "account": "call"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "call"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "nativeMint",
          "address": "So11111111111111111111111111111111111111112"
        },
        {
          "name": "mint"
        },
        {
          "name": "vaultWsol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "nativeMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vaultOut",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "outputTokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "poolAuthority",
          "address": "HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC"
        },
        {
          "name": "tokenAVault",
          "writable": true
        },
        {
          "name": "tokenBVault",
          "writable": true
        },
        {
          "name": "eventAuthority",
          "address": "3rmHSu74h1ZcmAisVcWerTCiRDQbUrBKmcwptYGjHfet"
        },
        {
          "name": "dammProgram"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "outputTokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "mint",
          "type": "pubkey"
        },
        {
          "name": "salt",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "minimumAmountOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "revealAndSwapDbc",
      "discriminator": [
        5,
        92,
        28,
        80,
        79,
        84,
        80,
        218
      ],
      "accounts": [
        {
          "name": "caller",
          "writable": true,
          "signer": true,
          "relations": [
            "call"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "call",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "call.caller",
                "account": "call"
              },
              {
                "kind": "account",
                "path": "call.call_id",
                "account": "call"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "call"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "nativeMint",
          "address": "So11111111111111111111111111111111111111112"
        },
        {
          "name": "mint"
        },
        {
          "name": "vaultWsol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "nativeMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vaultOut",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "outputTokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "dbcConfig"
        },
        {
          "name": "poolAuthority",
          "address": "FhVo3mqL8PW5pH5U2CN4XE33DokiyZnUwuGpH2hmHLuM"
        },
        {
          "name": "baseVault",
          "writable": true
        },
        {
          "name": "quoteVault",
          "writable": true
        },
        {
          "name": "eventAuthority",
          "address": "8Ks12pbrD6PXxfty1hVQiE9sc289zgU1zHkvXhrSdriF"
        },
        {
          "name": "dbcProgram",
          "address": "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "outputTokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "mint",
          "type": "pubkey"
        },
        {
          "name": "salt",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "minimumAmountOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setConfig",
      "discriminator": [
        108,
        158,
        154,
        175,
        212,
        98,
        52,
        66
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "configParams"
            }
          }
        }
      ]
    },
    {
      "name": "setPaused",
      "discriminator": [
        91,
        60,
        125,
        192,
        176,
        225,
        166,
        218
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "paused",
          "type": "bool"
        }
      ]
    },
    {
      "name": "sweepDust",
      "discriminator": [
        9,
        49,
        242,
        88,
        156,
        84,
        109,
        15
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "call",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "call.caller",
                "account": "call"
              },
              {
                "kind": "account",
                "path": "call.call_id",
                "account": "call"
              }
            ]
          }
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "call"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vaultOut",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasury"
        },
        {
          "name": "treasuryAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "follower",
          "writable": true,
          "signer": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "call",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "call.caller",
                "account": "call"
              },
              {
                "kind": "account",
                "path": "call.call_id",
                "account": "call"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "call"
              }
            ]
          }
        },
        {
          "name": "position",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "call"
              },
              {
                "kind": "account",
                "path": "follower"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "call",
      "discriminator": [
        62,
        231,
        169,
        58,
        154,
        150,
        83,
        196
      ]
    },
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "position",
      "discriminator": [
        170,
        188,
        143,
        228,
        122,
        64,
        247,
        208
      ]
    }
  ],
  "events": [
    {
      "name": "callExpired",
      "discriminator": [
        98,
        64,
        187,
        39,
        26,
        40,
        246,
        228
      ]
    },
    {
      "name": "callOpened",
      "discriminator": [
        80,
        97,
        83,
        218,
        46,
        113,
        128,
        51
      ]
    },
    {
      "name": "callerClaimed",
      "discriminator": [
        213,
        218,
        230,
        144,
        144,
        153,
        78,
        55
      ]
    },
    {
      "name": "claimed",
      "discriminator": [
        217,
        192,
        123,
        72,
        108,
        150,
        248,
        33
      ]
    },
    {
      "name": "configInitialized",
      "discriminator": [
        181,
        49,
        200,
        156,
        19,
        167,
        178,
        91
      ]
    },
    {
      "name": "configUpdated",
      "discriminator": [
        40,
        241,
        230,
        122,
        11,
        19,
        198,
        194
      ]
    },
    {
      "name": "deposited",
      "discriminator": [
        111,
        141,
        26,
        45,
        161,
        35,
        100,
        57
      ]
    },
    {
      "name": "dustSwept",
      "discriminator": [
        131,
        70,
        179,
        205,
        208,
        80,
        13,
        168
      ]
    },
    {
      "name": "pausedSet",
      "discriminator": [
        171,
        125,
        127,
        156,
        233,
        81,
        68,
        66
      ]
    },
    {
      "name": "refunded",
      "discriminator": [
        35,
        103,
        149,
        246,
        196,
        123,
        221,
        99
      ]
    },
    {
      "name": "revealed",
      "discriminator": [
        180,
        7,
        199,
        88,
        154,
        19,
        181,
        154
      ]
    },
    {
      "name": "withdrawn",
      "discriminator": [
        20,
        89,
        223,
        198,
        194,
        124,
        219,
        13
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "signer is not authorized for this action"
    },
    {
      "code": 6001,
      "name": "paused",
      "msg": "program is paused"
    },
    {
      "code": 6002,
      "name": "invalidConfig",
      "msg": "config parameter out of range"
    },
    {
      "code": 6003,
      "name": "invalidRevealWindow",
      "msg": "reveal window must be in (0, max_reveal_window_secs]"
    },
    {
      "code": 6004,
      "name": "invalidCallerLock",
      "msg": "caller lock is below the configured minimum"
    },
    {
      "code": 6005,
      "name": "vaultCapTooHigh",
      "msg": "max vault exceeds the configured per-call cap"
    },
    {
      "code": 6006,
      "name": "stakeTooLow",
      "msg": "caller stake is below the minimum share of max vault"
    },
    {
      "code": 6007,
      "name": "stakeAboveVault",
      "msg": "caller stake exceeds max vault"
    },
    {
      "code": 6008,
      "name": "zeroAmount",
      "msg": "amount must be greater than zero"
    },
    {
      "code": 6009,
      "name": "wrongState",
      "msg": "call is not in the required state"
    },
    {
      "code": 6010,
      "name": "deadlinePassed",
      "msg": "reveal deadline has passed"
    },
    {
      "code": 6011,
      "name": "deadlineNotPassed",
      "msg": "reveal deadline has not passed"
    },
    {
      "code": 6012,
      "name": "callerCannotDeposit",
      "msg": "caller cannot deposit into their own call"
    },
    {
      "code": 6013,
      "name": "depositCapExceeded",
      "msg": "per-follower deposit cap exceeded"
    },
    {
      "code": 6014,
      "name": "vaultCapExceeded",
      "msg": "call vault cap exceeded"
    },
    {
      "code": 6015,
      "name": "hashMismatch",
      "msg": "revealed (mint, pool, salt) does not match the commitment"
    },
    {
      "code": 6016,
      "name": "mintMismatch",
      "msg": "mint account does not match the revealed mint"
    },
    {
      "code": 6017,
      "name": "notDammPool",
      "msg": "pool is not a DAMM v2 pool"
    },
    {
      "code": 6018,
      "name": "poolMintMismatch",
      "msg": "pool does not trade exactly wSOL and the revealed mint"
    },
    {
      "code": 6019,
      "name": "poolVaultMismatch",
      "msg": "pool vault accounts do not match the pool state"
    },
    {
      "code": 6020,
      "name": "wrongTokenProgram",
      "msg": "output token program does not own the mint"
    },
    {
      "code": 6021,
      "name": "minOutZero",
      "msg": "minimum_amount_out must be greater than zero"
    },
    {
      "code": 6022,
      "name": "nothingToSwap",
      "msg": "nothing to swap"
    },
    {
      "code": 6023,
      "name": "slippageExceeded",
      "msg": "swap returned fewer tokens than minimum_amount_out"
    },
    {
      "code": 6024,
      "name": "invalidImpact",
      "msg": "max_impact_bps must be above zero and within the config ceiling"
    },
    {
      "code": 6025,
      "name": "priceImpactExceeded",
      "msg": "fill is worse than the pool spot price allows for this call"
    },
    {
      "code": 6026,
      "name": "poolNotSeasoned",
      "msg": "pool is disabled or was not live before the call opened"
    },
    {
      "code": 6027,
      "name": "poolLiquidityUnlocked",
      "msg": "pool has too little permanently locked liquidity"
    },
    {
      "code": 6028,
      "name": "poolTooThin",
      "msg": "swap is too large for the pool's wSOL reserve"
    },
    {
      "code": 6029,
      "name": "mintAuthorityLive",
      "msg": "mint has a live mint or freeze authority"
    },
    {
      "code": 6030,
      "name": "unsafeMintExtension",
      "msg": "mint carries a token extension that can tax, freeze, hook or seize transfers"
    },
    {
      "code": 6031,
      "name": "swapPartialFill",
      "msg": "swap left wSOL unspent"
    },
    {
      "code": 6032,
      "name": "depositTooSmall",
      "msg": "deposit is below the minimum"
    },
    {
      "code": 6033,
      "name": "callerLockActive",
      "msg": "caller lock period has not elapsed"
    },
    {
      "code": 6034,
      "name": "alreadyClaimed",
      "msg": "already claimed"
    },
    {
      "code": 6035,
      "name": "followersRemain",
      "msg": "follower positions remain"
    },
    {
      "code": 6036,
      "name": "nothingToSweep",
      "msg": "nothing to sweep"
    },
    {
      "code": 6037,
      "name": "overflow",
      "msg": "arithmetic overflow"
    },
    {
      "code": 6038,
      "name": "notDbcPool",
      "msg": "pool is not a Meteora DBC virtual pool"
    },
    {
      "code": 6039,
      "name": "dbcConfigMismatch",
      "msg": "DBC config account does not match the pool state"
    },
    {
      "code": 6040,
      "name": "poolMigrated",
      "msg": "DBC pool has completed its curve or migrated"
    }
  ],
  "types": [
    {
      "name": "call",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "caller",
            "type": "pubkey"
          },
          {
            "name": "callId",
            "type": "u64"
          },
          {
            "name": "commitment",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "openedAt",
            "type": "i64"
          },
          {
            "name": "openedSlot",
            "type": "u64"
          },
          {
            "name": "revealDeadline",
            "type": "i64"
          },
          {
            "name": "callerLockSecs",
            "type": "i64"
          },
          {
            "name": "maxVaultLamports",
            "type": "u64"
          },
          {
            "name": "maxImpactBps",
            "docs": [
              "worst fill vs the pool spot price at reveal, fixed at open so followers see it before depositing"
            ],
            "type": "u16"
          },
          {
            "name": "feeBps",
            "docs": [
              "fee terms fixed at open: a later set_config never reprices a funded call"
            ],
            "type": "u16"
          },
          {
            "name": "callerFeeShareBps",
            "type": "u16"
          },
          {
            "name": "callerStakeLamports",
            "type": "u64"
          },
          {
            "name": "followerLamports",
            "type": "u64"
          },
          {
            "name": "followerCount",
            "type": "u32"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "callState"
              }
            }
          },
          {
            "name": "revealedMint",
            "type": "pubkey"
          },
          {
            "name": "revealedPool",
            "type": "pubkey"
          },
          {
            "name": "lamportsIn",
            "type": "u64"
          },
          {
            "name": "tokensOut",
            "type": "u64"
          },
          {
            "name": "executedAt",
            "type": "i64"
          },
          {
            "name": "executedSlot",
            "type": "u64"
          },
          {
            "name": "tokensClaimed",
            "type": "u64"
          },
          {
            "name": "callerClaimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "callExpired",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "call",
            "type": "pubkey"
          },
          {
            "name": "caller",
            "type": "pubkey"
          },
          {
            "name": "returnedLamports",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "callOpened",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "call",
            "type": "pubkey"
          },
          {
            "name": "caller",
            "type": "pubkey"
          },
          {
            "name": "callId",
            "type": "u64"
          },
          {
            "name": "commitment",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "revealDeadline",
            "type": "i64"
          },
          {
            "name": "callerLockSecs",
            "type": "i64"
          },
          {
            "name": "maxVaultLamports",
            "type": "u64"
          },
          {
            "name": "maxImpactBps",
            "type": "u16"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "callerFeeShareBps",
            "type": "u16"
          },
          {
            "name": "callerStakeLamports",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "callState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "executed"
          },
          {
            "name": "expired"
          }
        ]
      }
    },
    {
      "name": "callerClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "call",
            "type": "pubkey"
          },
          {
            "name": "caller",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "claimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "call",
            "type": "pubkey"
          },
          {
            "name": "follower",
            "type": "pubkey"
          },
          {
            "name": "lamports",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "callerFeeShareBps",
            "type": "u16"
          },
          {
            "name": "maxCallLamports",
            "type": "u64"
          },
          {
            "name": "maxDepositLamports",
            "type": "u64"
          },
          {
            "name": "minCallerStakeBps",
            "type": "u16"
          },
          {
            "name": "minCallerLockSecs",
            "type": "i64"
          },
          {
            "name": "maxRevealWindowSecs",
            "type": "i64"
          },
          {
            "name": "maxPriceImpactBps",
            "docs": [
              "ceiling for a call's max_impact_bps"
            ],
            "type": "u16"
          },
          {
            "name": "minLockedLiquidityBps",
            "docs": [
              "pool must hold at least this share of its liquidity permanently locked"
            ],
            "type": "u16"
          },
          {
            "name": "maxSwapReserveBps",
            "docs": [
              "the swap may use at most this share of the pool's wSOL reserve"
            ],
            "type": "u16"
          },
          {
            "name": "minDepositLamports",
            "type": "u64"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "configInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "configParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "callerFeeShareBps",
            "type": "u16"
          },
          {
            "name": "maxCallLamports",
            "type": "u64"
          },
          {
            "name": "maxDepositLamports",
            "type": "u64"
          },
          {
            "name": "minCallerStakeBps",
            "type": "u16"
          },
          {
            "name": "minCallerLockSecs",
            "type": "i64"
          },
          {
            "name": "maxRevealWindowSecs",
            "type": "i64"
          },
          {
            "name": "maxPriceImpactBps",
            "type": "u16"
          },
          {
            "name": "minLockedLiquidityBps",
            "type": "u16"
          },
          {
            "name": "maxSwapReserveBps",
            "type": "u16"
          },
          {
            "name": "minDepositLamports",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "configUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "callerFeeShareBps",
            "type": "u16"
          },
          {
            "name": "maxCallLamports",
            "type": "u64"
          },
          {
            "name": "maxDepositLamports",
            "type": "u64"
          },
          {
            "name": "minCallerStakeBps",
            "type": "u16"
          },
          {
            "name": "minCallerLockSecs",
            "type": "i64"
          },
          {
            "name": "maxRevealWindowSecs",
            "type": "i64"
          },
          {
            "name": "maxPriceImpactBps",
            "type": "u16"
          },
          {
            "name": "minLockedLiquidityBps",
            "type": "u16"
          },
          {
            "name": "maxSwapReserveBps",
            "type": "u16"
          },
          {
            "name": "minDepositLamports",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "deposited",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "call",
            "type": "pubkey"
          },
          {
            "name": "follower",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "positionLamports",
            "type": "u64"
          },
          {
            "name": "followerCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "dustSwept",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "call",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "pausedSet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "paused",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "call",
            "type": "pubkey"
          },
          {
            "name": "follower",
            "type": "pubkey"
          },
          {
            "name": "lamports",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "refunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "call",
            "type": "pubkey"
          },
          {
            "name": "follower",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "revealed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "call",
            "type": "pubkey"
          },
          {
            "name": "caller",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "totalLamports",
            "type": "u64"
          },
          {
            "name": "feeLamports",
            "type": "u64"
          },
          {
            "name": "callerFeeLamports",
            "type": "u64"
          },
          {
            "name": "lamportsIn",
            "type": "u64"
          },
          {
            "name": "tokensOut",
            "type": "u64"
          },
          {
            "name": "slot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "withdrawn",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "call",
            "type": "pubkey"
          },
          {
            "name": "follower",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
