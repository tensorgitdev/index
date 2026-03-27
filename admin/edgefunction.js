import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4"
import satori from "https://esm.sh/satori@0.10.11"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function emojiToTwemojiUrl(emoji) {
  const codePoint = [...emoji]
    .map(e => e.codePointAt(0).toString(16))
    .filter(c => c !== 'fe0f')
    .join('-')
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoint}.png`
}

function extractEmojis(str) {
  const emojiRegex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu
  return [...new Set(str.match(emojiRegex) || [])]
}

async function emojiToBase64(emoji) {
  const codePoint = [...emoji]
    .map(e => e.codePointAt(0))
    .filter(cp => cp !== 0xfe0f)
    .map(cp => cp.toString(16).padStart(4, '0'))
    .join('-')
  const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoint}.png`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`이모지 fetch 실패: ${url}`)
  const buf = await res.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
  return `data:image/png;base64,${base64}`
}

serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders })
  }

  try {
    const { id, message, emoji } = await req.json()

    const safeMessage = String(message || "")
    const safeEmoji = String(emoji || "")

    console.log("id", id)
    console.log("message", message)
    console.log("emoji", safeEmoji)

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const [fontRegular, fontBold] = await Promise.all([
      fetch("https://github.com/googlefonts/noto-cjk/raw/main/Sans/SubsetOTF/KR/NotoSansKR-Regular.otf").then(res => res.arrayBuffer()),
      fetch("https://github.com/googlefonts/noto-cjk/raw/main/Sans/SubsetOTF/KR/NotoSansKR-Bold.otf").then(res => res.arrayBuffer())
    ])

    /*
    const graphemeImages = {
      [safeEmoji]: emojiToTwemojiUrl(safeEmoji)
    }
    console.log("이모지 URL:", graphemeImages)
    */

    /*
    const emojiBase64 = await emojiToBase64(safeEmoji)
    const graphemeImages = {
      [safeEmoji]: emojiBase64
    }*/

// 메시지 + 이모지 필드에서 모든 이모지 추출
const allEmojis = extractEmojis(safeMessage + safeEmoji)
const graphemeImages = {}
await Promise.all(
  allEmojis.map(async (emoji) => {
    graphemeImages[emoji] = await emojiToBase64(emoji)
  })
)
      
    const svg = await satori(
      {
        type: "div",
        props: {
          style: {
            width: "1200px",
            height: "630px",
            display: "flex",
            backgroundColor: "#ebedef",
            padding: "40px",
            fontFamily: "NotoKR",
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: "#ffffff",
                  borderRadius: "60px",
                  padding: "80px 100px",
                  position: "relative",
                },
                children: [
                  {
                    type: "div",
                    props: {
                      children: "ask me anything",
                      style: {
                        fontSize: "48px",
                        fontWeight: 700,
                        color: "#d1d5db",
                        marginBottom: "40px",
                      },
                    },
                  },
                  // 이모지
                  {
                    type: "div",
                    props: {
                      children: safeEmoji,
                      style: {
                        fontSize: "60px",
                        marginBottom: "20px",
                      },
                    },
                  },
                  // 메시지
                  {
                    type: "div",
                    props: {
                      style: {
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            children: safeMessage,
                            style: {
                              fontSize: "40px",
                              fontWeight: 400,
                              lineHeight: "1.2",
                              color: "#374151",
                              textAlign: "center",
                              wordBreak: "keep-all",
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: "NotoKR", data: fontRegular, weight: 400, style: "normal" },
          { name: "NotoKR", data: fontBold, weight: 700, style: "normal" },
        ],
        graphemeImages,
      }
    )

    const svgData = new TextEncoder().encode(svg)
    const filePath = `cards/${id}.svg`

    const { error: uploadError } = await supabase.storage
      .from("guestbook")
      .upload(filePath, svgData, {
        contentType: "image/svg+xml",
        upsert: true,
      })

    if (uploadError) {
      return new Response(uploadError.message, { status: 500, headers: corsHeaders })
    }

    const { data } = supabase.storage
      .from("guestbook")
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from("guestbook")
      .update({ gb_card_image_url: data.publicUrl })
      .eq("gb_id", id)

    if (updateError) {
      return new Response(updateError.message, { status: 500, headers: corsHeaders })
    }

    return new Response(
      JSON.stringify({ success: true, url: data.publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err) {
    console.error("에러:", err.message, err.stack)
    return new Response(err.message, { status: 500, headers: corsHeaders })
  }
})