import requests

def generate_ddr(inspection_text, thermal_text):

    prompt = f"""
You are a senior civil diagnostics engineer preparing a professional DDR report.

You are given:
1. Inspection Report findings
2. Thermal Report findings

STRICT RULES:
- Use ONLY facts explicitly present in the provided text.
- Never invent structural damage, settlement, hidden defects, or unsupported conclusions.
- If uncertain, say: "Further inspection recommended."
- If thermal temperatures are present, mention them carefully.
- Cooler zones may indicate possible moisture retention.
- Warmer zones may indicate heat exposure or material variation.
- Do NOT claim certainty from thermal images alone.
- Avoid repetition.
- Keep language professional, concise, and client-friendly.

CONFLICT HANDLING:
- If inspection findings suggest an issue but thermal findings do not clearly support it, state:
  "Visual observations indicate concern, while thermal evidence is inconclusive."
- If both reports appear inconsistent, state:
  "Conflicting findings detected between source reports. Further inspection recommended."

IMAGE HANDLING:
- If no clear image evidence is available for an observation, mention:
  "Relevant image not available."
- Do NOT mention images unless useful to the report.

Return EXACTLY these sections:

## 1. Property Issue Summary
## 2. Area-wise Observations
## 3. Probable Root Cause
## 4. Severity Assessment
## 5. Recommended Actions
## 6. Additional Notes
## 7. Missing or Unclear Information

GUIDANCE FOR AREA-WISE OBSERVATIONS:
- Organize findings room-wise or zone-wise wherever possible.
- Mention if evidence came from inspection observations, thermal findings, or both.
- If data for an area is incomplete, say "Limited information available."

Inspection Findings:
{inspection_text}

Thermal Findings:
{thermal_text}

Generate the final DDR only.
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1:latest",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 700,
                    "top_p": 0.85
                }
            },
            timeout=240
        )

        response.raise_for_status()
        return response.json()["response"]

    except Exception as e:
        return f"ERROR: {str(e)}"