import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4"
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
const [fontRegular, fontBold] = await Promise.all([
  fetch("https://github.com/googlefonts/noto-cjk/raw/main/Sans/SubsetOTF/KR/NotoSansKR-Regular.otf").then(res => res.arrayBuffer()),
  fetch("https://github.com/googlefonts/noto-cjk/raw/main/Sans/SubsetOTF/KR/NotoSansKR-Bold.otf").then(res => res.arrayBuffer())
]);

        // =========================================== 디자인 영역 START
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
              // 상단 ask me anything (Bold 적용)
              {
                type: "div",
                props: {
                  children: "ask me anything",
                  style: {
                    fontSize: "48px",
                    fontWeight: 700, // Bold 폰트 사용
                    color: "#d1d5db",
                    marginBottom: "40px",
                  },
                },
              },
              // 중앙 메시지 (Regular 적용)
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
                          fontWeight: 400, // Regular 폰트 사용
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
      {
        name: "NotoKR",
        data: fontRegular,
        weight: 400,
        style: "normal",
      },
      {
        name: "NotoKR",
        data: fontBold,
        weight: 700,
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