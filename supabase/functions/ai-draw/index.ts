import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DrawRequest {
  teams: string[];
  tournamentType: 'knockout' | 'league' | 'groups';
  numGroups?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teams, tournamentType, numGroups = 4 }: DrawRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing AI draw for ${teams.length} teams, type: ${tournamentType}`);

    let systemPrompt = "";
    let userPrompt = "";

    if (tournamentType === "knockout") {
      systemPrompt = `أنت مساعد ذكي لإجراء قرعة بطولات كرة القدم. مهمتك توزيع الفرق بشكل عادل ومتوازن في نظام خروج المغلوب.
      يجب أن تراعي التوازن بين الفرق القوية والضعيفة.
      أعد الترتيب بحيث تتجنب مواجهة الفرق القوية في الأدوار المبكرة.`;
      
      userPrompt = `الفرق المشاركة: ${teams.join(", ")}
      
      المطلوب: رتب الفرق لبطولة خروج المغلوب.
      
      أعد النتيجة كـ JSON بالشكل التالي:
      {
        "draw": ["الفريق1", "الفريق2", "الفريق3", "الفريق4", ...]
      }
      
      حيث كل فريقين متتاليين يلعبان ضد بعضهما في الجولة الأولى.`;
    } else if (tournamentType === "groups") {
      systemPrompt = `أنت مساعد ذكي لإجراء قرعة بطولات كرة القدم. مهمتك توزيع الفرق على المجموعات بشكل عادل ومتوازن.
      يجب أن تراعي التوازن بين الفرق في كل مجموعة.`;
      
      userPrompt = `الفرق المشاركة: ${teams.join(", ")}
      عدد المجموعات: ${numGroups}
      
      المطلوب: وزع الفرق على المجموعات بشكل عادل.
      
      أعد النتيجة كـ JSON بالشكل التالي:
      {
        "groups": {
          "A": ["فريق1", "فريق2", ...],
          "B": ["فريق3", "فريق4", ...],
          ...
        }
      }`;
    } else {
      // league - just randomize
      systemPrompt = `أنت مساعد ذكي لإجراء قرعة الدوري. مهمتك ترتيب الفرق بشكل عشوائي.`;
      
      userPrompt = `الفرق المشاركة: ${teams.join(", ")}
      
      المطلوب: رتب الفرق بشكل عشوائي للدوري.
      
      أعد النتيجة كـ JSON بالشكل التالي:
      {
        "draw": ["الفريق1", "الفريق2", ...]
      }`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام ميزة الذكاء الاصطناعي" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response:", content);
    
    const drawResult = JSON.parse(content);

    return new Response(JSON.stringify(drawResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI draw error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ في القرعة" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
