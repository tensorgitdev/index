import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"
import satori from "https://esm.sh/satori@0.10.11"

// ✅ CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {

    // 🔥 preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            status: 200,
            headers: corsHeaders,
        })
    }

    try {
        const { id, message, emoji } = await req.json()

        const safeMessage = String(message || "")
        const safeEmoji = String(emoji || "")

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        )

        // 🔥 폰트 fetch (핵심)
        const fontData = await fetch(
            "https://github.com/googlefonts/noto-cjk/raw/main/Sans/SubsetOTF/KR/NotoSansKR-Regular.otf"
        ).then(res => res.arrayBuffer())


        // =========================================== 디자인 영역 START
const svg = await satori(
  {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        backgroundColor: "#ebedef", // 바깥쪽 연한 회색 배경
        padding: "40px", // 바깥 테두리 두께
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
              backgroundColor: "#ffffff", // 메인 흰색 카드
              borderRadius: "60px", // 이미지와 유사한 큰 곡률
              padding: "60px 100px",
              position: "relative",
            },
            children: [
              // 1. 상단 중앙 "ask me anything"
              {
                type: "div",
                props: {
                  children: "ask me anything",
                  style: {
                    fontSize: "48px",
                    fontWeight: "900",
                    color: "#d1d5db", // 아주 연한 회색 텍스트
                    marginBottom: "40px",
                    letterSpacing: "-0.02em",
                  },
                },
              },
              // 2. 중앙 메인 메시지
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
                          fontSize: "38px",
                          fontWeight: "500", // 너무 굵지 않은 적당한 두께
                          lineHeight: "1.6",
                          color: "#374151", // 부드러운 다크 그레이
                          textAlign: "center",
                          wordBreak: "keep-all",
                        },
                      },
                    },
                  ],
                },
              },
              // 하단 여백용 (상단 텍스트와 균형을 맞추기 위함)
              {
                type: "div",
                props: {
                  style: {
                    height: "60px",
                  },
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
      {
        name: "NotoKR",
        data: fontData,
        weight: 500,
        style: "normal",
      },
      {
        name: "NotoKR",
        data: fontData,
        weight: 900,
        style: "normal",
      },
    ],
  }
);

// =========================================== 디자인 영역 END

        // 🔥 SVG → binary
        const svgData = new TextEncoder().encode(svg)

        const filePath = `cards/${id}.svg`

        // 🔥 업로드
        const { error: uploadError } = await supabase.storage
            .from("guestbook")
            .upload(filePath, svgData, {
                contentType: "image/svg+xml",
                upsert: true,
            })

        if (uploadError) {
            return new Response(uploadError.message, {
                status: 500,
                headers: corsHeaders,
            })
        }

        // 🔥 URL 생성
        const { data } = supabase.storage
            .from("guestbook")
            .getPublicUrl(filePath)

        // 🔥 DB 업데이트
        const { error: updateError } = await supabase
            .from("guestbook")
            .update({ gb_card_image_url: data.publicUrl })
            .eq("gb_id", id)

        if (updateError) {
            return new Response(updateError.message, {
                status: 500,
                headers: corsHeaders,
            })
        }

        return new Response(
            JSON.stringify({ success: true, url: data.publicUrl }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            }
        )

    } catch (err) {
        return new Response(err.message, {
            status: 500,
            headers: corsHeaders,
        })
    }
})