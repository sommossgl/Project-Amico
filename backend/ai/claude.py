import os
import anthropic

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-6"

# Output token budget — large enough to list long tables (200+ rows).
# Previously 2048, which truncated long answers (~35 of 47 rows).
MAX_TOKENS = 8192

_TRUNCATION_NOTE = (
    "\n\n---\n⚠️ *คำตอบอาจยาวเกินขนาดที่กำหนด — บางส่วนถูกตัด "
    "ลองถามเจาะจงขึ้น (เช่น ขอเฉพาะบางหมวด หรือแบ่งเป็นช่วง) "
    "หรือขอให้สรุปแทนการลิสต์ทั้งหมด*"
)


def _extract_text(response) -> str:
    """Get reply text + append a notice if the answer was cut off."""
    text = response.content[0].text if response.content else ""
    if getattr(response, "stop_reason", None) == "max_tokens":
        text += _TRUNCATION_NOTE
    return text


def chat_with_file(file_content: str, file_name: str, user_message: str) -> str:
    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system="คุณคือ Amico ผู้ช่วย AI ของ SompenTech ที่เชี่ยวชาญการวิเคราะห์เอกสาร ตอบคำถามโดยอิงจากเนื้อหาในไฟล์ที่ได้รับเท่านั้น ห้าม hallucinate — เมื่อผู้ใช้ขอ 'ทุกรายการ' ให้ลิสต์ครบทุกรายการจริง ห้ามตัดทอนเอง",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"<document name=\"{file_name}\">\n{file_content}\n</document>",
                        "cache_control": {"type": "ephemeral"},
                    },
                    {"type": "text", "text": user_message},
                ],
            }
        ],
        extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
    )
    return _extract_text(response)


def summarize_file(file_content: str, file_name: str) -> str:
    return chat_with_file(file_content, file_name, "สรุปเนื้อหาหลักของเอกสารนี้ให้กระชับและครอบคลุม")


def chat_with_files(docs: list[dict], user_message: str) -> str:
    """Chat with multiple Drive files simultaneously"""
    doc_blocks = [
        {
            "type": "text",
            "text": f"<document name=\"{d['name']}\">\n{d['content']}\n</document>",
            "cache_control": {"type": "ephemeral"},
        }
        for d in docs
    ]
    doc_blocks.append({"type": "text", "text": user_message})

    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system="คุณคือ Amico ผู้ช่วย AI ของ SompenTech ตอบโดยอิงจากเนื้อหาในเอกสารที่ได้รับเท่านั้น ห้าม hallucinate — เมื่อผู้ใช้ขอ 'ทุกรายการ' ให้ลิสต์ครบทุกรายการจริง ห้ามตัดทอนเอง",
        messages=[{"role": "user", "content": doc_blocks}],
        extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
    )
    return _extract_text(response)
