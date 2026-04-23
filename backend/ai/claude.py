import os
import anthropic

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-6"


def chat_with_file(file_content: str, file_name: str, user_message: str) -> str:
    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system="คุณคือ Amico ผู้ช่วย AI ของ SompenTech ที่เชี่ยวชาญการวิเคราะห์เอกสาร ตอบคำถามโดยอิงจากเนื้อหาในไฟล์ที่ได้รับเท่านั้น ห้าม hallucinate",
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
    return response.content[0].text


def summarize_file(file_content: str, file_name: str) -> str:
    return chat_with_file(file_content, file_name, "สรุปเนื้อหาหลักของเอกสารนี้ให้กระชับและครอบคลุม")
