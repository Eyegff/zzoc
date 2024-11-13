// app.js

const express = require('express');
const line = require('@line/bot-sdk');
const qrcode = require('qrcode');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { URL } = require('url');

// ตั้งค่าการบันทึกล็อก
const logger = console;

// ใส่โทเค็นบอทตรงนี้ (ไม่แนะนำให้ทำในโปรดักชัน)
const config = {
    channelSecret: 'UKcDMbQt8jAwg7zji13tVf50BPdwOsQYhtyK1D+kACdxYJt1XKY0kvhYdiOK8GE4fgHsrakIGT9Q4UCphSpIhNJwMBeDKaWMzU06YUwhHUqiD7qE5H3GSVvKvpFygwA7DXP8MroQPNW+onG+UYXQ1AdB04t89/1O/w1cDnyilFU=', // แทนที่ด้วย Channel Secret ของคุณ
    channelAccessToken: '6884027b48dc05ad5deadf87245928da' // แทนที่ด้วย Channel Access Token ของคุณ
};
const LINE_TARGET_ID = 'YOUR_TARGET_ID_HERE'; // แทนที่ด้วย User ID หรือ Group ID ที่ต้องการส่งข้อความอัปเดต

const client = new line.Client(config);
const app = express();

// คำศัพท์ภาษาไทย
const thai_prefixes = [
    'เทพ', 'พญา', 'ราชา', 'จอม', 'เซียน', 'ปราชญ์', 'มาสเตอร์', 'ซุปเปอร์', 'อัลตร้า', 'เมก้า',
    'จักร', 'มหา', 'ยอด', 'เจ้า', 'ทิพย์', 'ทิว', 'พระ', 'มือ', 'สุด', 'เหนือ', 'สายลม', 'อัศวิน',
    'ดิจิ', 'ไซเบอร์', 'ไวรัส', 'คอสมิก', 'เทอร์โบ', 'นิวเคลียร์', 'แร็พเตอร์', 'โครโนส'
];

const thai_main_words = [
    'สายฟ้า', 'เหนือเมฆ', 'พลังเทพ', 'จักรวาล', 'มังกร', 'เกราะเพชร', 'สายลับ', 'พลังจิต',
    'เหนือฟ้า', 'ทะยานดาว', 'คลื่นเหล็ก', 'พายุดาว', 'เกราะทอง', 'สายนักรบ', 'เทพเวหา',
    'ราชาเน็ต', 'ความเร็วแสง', 'พลังเน็ต', 'สายด่วน', 'เน็ตทะลุ', 'ไร้ขีดจำกัด', 'ทะลุมิติ',
    'ดาบศักดิ์สิทธิ์', 'ฟีนิกซ์', 'ดาวตก', 'นินจา', 'สปาย', 'อินฟินิตี้', 'สตรอม', 'ซิกม่า'
];

const thai_suffixes = [
    'ทะลุมิติ', 'พันธุ์แกร่ง', 'เหนือชั้น', 'ไร้ขีดจำกัด', 'ทะลุฟ้า', 'พิชิตใจ', 'ไร้เทียมทาน',
    'เกินต้าน', 'ไร้พ่าย', 'ชาญเน็ต', 'แห่งยุค', 'สปีด', 'สปีดสตาร์', 'ซุปเปอร์สปีด', 'เทอร์โบ',
    'เมก้าบูสต์', 'อัลติเมท', 'สปีดแม็กซ์', 'แรงทะลุฟ้า', 'เต็มสปีด', 'ซุปเปอร์เน็ต'
];

// คำศัพท์ภาษาอังกฤษ
const english_prefixes = [
    'CYBER', 'QUANTUM', 'HYPER', 'ULTRA', 'MEGA', 'SUPER', 'THUNDER', 'LIGHTNING',
    'PLASMA', 'NOVA', 'NEXUS', 'ELITE', 'PRIME', 'OMEGA', 'ALPHA', 'DELTA',
    'GIGA', 'TURBO', 'INFINITE', 'VELOCITY', 'BLAZE', 'FLASH', 'CRYPTO', 'PHOENIX'
];

const english_main_words = [
    'SPEED', 'SURGE', 'FLUX', 'FORCE', 'PULSE', 'WAVE', 'STREAM', 'BEAM',
    'CORE', 'BLADE', 'EDGE', 'RUSH', 'BURST', 'BLAST', 'SPARK', 'VOLT',
    'BOOST', 'DRIVE', 'ZONE', 'LINK', 'NET', 'VORTEX', 'CYCLONE', 'STORM'
];

const english_suffixes = [
    'PRO', 'MAX', 'PLUS', 'ELITE', 'PREMIUM', 'EXTREME', 'ULTIMATE', 'MASTER',
    'X', 'ZERO', 'ALPHA', 'OMEGA', 'PRIME', 'CORE', 'NEXT', 'NOVA',
    'BOOST', 'VELOCITY', 'EDGE', 'FUSION', 'INFINITY', 'TURBO', 'EXPERT'
];

const tech_terms = [
    '5G', '64K', 'X1', 'V2', 'X2', 'GT', 'XS', 'XT',
    'RTX', 'GTX', 'PRO', 'MAX', 'PLUS', 'ULTRA', 'XR', 'RS',
    'VPN', 'NET', 'LINK', 'DATA', 'STREAM', 'ONLINE', 'WEB', 'DIGI'
];

// ลิงก์รูปภาพพื้นหลังและโลโก้
const BACKGROUND_URLS = [
    "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800"
];

const LOGO_URL = "https://raw.githubusercontent.com/github/explore/main/topics/python/python.png";

// ตัวแปรสำหรับเก็บข้อมูล
let generated_names = new Set();
let true_v2_count = 0;

// ตัวแปรสำหรับควบคุมลำดับการสร้างโค้ด
const sequence = ['TRUE_PRO_FACEBOOK'];
let sequence_index = 0;

// สร้างโฟลเดอร์ static ถ้าไม่มี
const staticDir = path.join(__dirname, 'static');
if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir);
}

// ฟังก์ชันดึงโค้ด VLESS จาก URL
async function fetch_vless_codes() {
    const urls = [
        "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub1.txt",
        "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub2.txt",
        "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub3.txt",
        "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub4.txt",
        "https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub5.txt"
    ];

    let all_codes = [];

    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            const vless_pattern = /vless:\/\/[^#\s]+/g;
            const codes = text.match(vless_pattern) || [];
            all_codes = all_codes.concat(codes);
            logger.info(`ดึงโค้ด VLESS จาก ${url} ได้ ${codes.length} โค้ด`);
        } catch (error) {
            logger.error(`เกิดข้อผิดพลาดในการดึงโค้ดจาก ${url}: ${error}`);
        }
    }

    return all_codes;
}

// ฟังก์ชันกรองโค้ด VLESS ตาม SNI
function filter_vless_codes_by_sni(codes, target_sni = 'BpB-V.PagEs.dev') {
    let filtered_codes = [];

    for (const code of codes) {
        try {
            const parsed_url = new URL(code);
            if (parsed_url.protocol.toLowerCase() !== 'vless:') {
                continue;
            }

            const params = new URLSearchParams(parsed_url.search);
            const sni_params = ['sni', 'serverName', 'host'];
            let found_sni = false;

            for (const param of sni_params) {
                if (params.has(param)) {
                    const sni_value = params.get(param);
                    if (sni_value.toLowerCase() === target_sni.toLowerCase()) {
                        filtered_codes.push(code);
                        found_sni = true;
                        break;
                    }
                }
            }

            if (!found_sni) {
                const host = parsed_url.hostname.toLowerCase();
                if (host === target_sni.toLowerCase()) {
                    filtered_codes.push(code);
                }
            }

        } catch (error) {
            logger.error(`ข้ามโค้ดเนื่องจากข้อผิดพลาด: ${error}`);
            continue;
        }
    }

    return filtered_codes;
}

// ฟังก์ชันสร้างชื่อโค้ดแบบสุ่ม
function generate_random_code_name(provider) {
    const max_attempts = 1000;
    let attempt = 0;

    while (attempt < max_attempts) {
        attempt += 1;

        const use_thai = Math.random() < 0.5;
        let name_body = '';

        if (use_thai) {
            const prefix = thai_prefixes[Math.floor(Math.random() * thai_prefixes.length)];
            const main_word = thai_main_words[Math.floor(Math.random() * thai_main_words.length)];
            const suffix = thai_suffixes[Math.floor(Math.random() * thai_suffixes.length)];
            const use_suffix = Math.random() < 0.7;
            name_body = use_suffix ? `${prefix}${main_word}${suffix}` : `${prefix}${main_word}`;
        } else {
            const prefix = english_prefixes[Math.floor(Math.random() * english_prefixes.length)];
            const main_word = english_main_words[Math.floor(Math.random() * english_main_words.length)];
            const suffix = english_suffixes[Math.floor(Math.random() * english_suffixes.length)];
            const tech_term = tech_terms[Math.floor(Math.random() * tech_terms.length)];

            const name_pattern = Math.floor(Math.random() * 5) + 1;
            switch (name_pattern) {
                case 1:
                    name_body = `${prefix}-${main_word}-${suffix}`;
                    break;
                case 2:
                    name_body = `${prefix}${tech_term}-${main_word}${suffix}`;
                    break;
                case 3:
                    name_body = `${prefix}-${main_word}-${tech_term}`;
                    break;
                case 4:
                    name_body = `${prefix}-${main_word}-${tech_term}-${suffix}`;
                    break;
                default:
                    name_body = `${prefix}${main_word}-${suffix}${tech_term}`;
            }
        }

        let network_prefix = '';
        if (provider.toUpperCase() === 'TRUE') {
            const options = ['TRUE', 'TRUEMOVE', 'TRUEONLINE'];
            network_prefix = options[Math.floor(Math.random() * options.length)];
        } else {
            const options = ['AIS', 'AISONLINE', 'AISFIBRE'];
            network_prefix = options[Math.floor(Math.random() * options.length)];
        }

        // เพิ่มอิโมจิแบบสุ่ม
        const emojis = [
            '🚀', '⚡', '🌟', '💫', '✨', '🔥', '💥', '🌈', '🎯', '🎮',
            '🛡️', '🌐', '🔰', '🌀', '⚔️', '🎆', '🎇', '🚧', '📡', '📶',
            '🔌', '💻', '📲', '🛰️', '🔮', '🕹️', '⚙️', '💠', '🧿', '🗲'
        ];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];

        let code_name = `${emoji} ${network_prefix} ${name_body}`;

        if (Math.random() < 0.5) {
            const separators = ['×', '•', '⚡', '☆', '★', '➤', '⟫', '❯', '◉', '◈', '➥', '☯', '✦', '✧'];
            const separator = separators[Math.floor(Math.random() * separators.length)];
            code_name = code_name.replace(' ', ` ${separator} `, 1);
        }

        if (!generated_names.has(code_name)) {
            generated_names.add(code_name);
            return code_name;
        }
    }

    throw new Error("ไม่สามารถสร้างชื่อโค้ดที่ไม่ซ้ำกันได้");
}

// ฟังก์ชันสร้างโค้ดอัตโนมัติ
async function generate_code_auto() {
    const current_step = sequence[sequence_index % sequence.length];
    sequence_index += 1;

    try {
        logger.info(`เริ่มสร้างโค้ดสำหรับ: ${current_step}`);
        if (current_step === 'TRUE_PRO_FACEBOOK') {
            const provider = 'TRUE';
            // ดึงโค้ด TRUE V2 จาก URL
            const all_codes = await fetch_vless_codes();
            const filtered_codes = filter_vless_codes_by_sni(all_codes, 'BpB-V.PagEs.dev');
            logger.info(`ทั้งหมด ${all_codes.length} โค้ดที่ดึงมา`);
            logger.info(`หลังจากกรองเหลือ ${filtered_codes.length} โค้ด`);

            if (filtered_codes.length === 0) {
                logger.warn("ไม่พบโค้ด TRUE V2 ที่ใช้งานได้");
                return null;
            }

            let code_template = filtered_codes[Math.floor(Math.random() * filtered_codes.length)];
            let code_name = generate_random_code_name(provider) + " V2";
            true_v2_count += 1;

            // เก็บ host เดิมก่อนการปรับปรุง
            const parsed_url = new URL(code_template);
            const original_host = parsed_url.hostname;

            // ปรับปรุง host เป็น 's.true.th'
            let new_netloc = parsed_url.host;
            if (parsed_url.username || parsed_url.password) {
                const userinfo = parsed_url.username ? parsed_url.username : '';
                const password = parsed_url.password ? `:${parsed_url.password}` : '';
                const host_port = parsed_url.port ? `:${parsed_url.port}` : '';
                new_netloc = `${userinfo}${password}@s.true.th${host_port}`;
            } else {
                new_netloc = parsed_url.port ? `s.true.th:${parsed_url.port}` : 's.true.th';
            }

            // สร้าง URL ใหม่
            parsed_url.hostname = 's.true.th';
            parsed_url.host = new_netloc;
            parsed_url.hash = encodeURIComponent(code_name);
            code_template = parsed_url.toString();

            // ใช้ host เดิมในข้อความ
            const server_host = original_host;
            const provider_text = "TRUE V2 | โปรเฟส-เกมมิ่ง";
            const instructions = (
                "วิธีใช้งาน TRUE V2:\n" +
                "1. เปิดแอพ v2BOX\n" +
                "2. วางโค้ดลงไป\n\n" +
                "สมัครโปรเน็ตทรู:\n" +
                "- กด *935*99# เฟส100MB/วัน\n" +
                "- หรือ *935*59# เกมมิ่ง100MB/วัน\n" +
                "- แนะนำใช้โปร *900*2894# 512KB\n" +
                "- ราคา 22 บาท นาน 7 วัน\n\n" +
                "- ขอให้มีความสุขกับการใช้เน็ต"
            );
            logger.info(`สร้างโค้ด TRUE V2: ${code_name}`);

            // สร้าง QR Code และภาพ
            const background_url = BACKGROUND_URLS[Math.floor(Math.random() * BACKGROUND_URLS.length)];
            const background_image = await Jimp.read(background_url);
            background_image.resize(800, 1200);

            const qr_code_data = code_template;
            const qr_code_image = await qrcode.toDataURL(qr_code_data, { errorCorrectionLevel: 'H', type: 'image/png' });
            const qr_image = await Jimp.read(Buffer.from(qr_code_image.split(',')[1], 'base64'));
            qr_image.resize(300, 300);

            // เพิ่มโลโก้
            try {
                const logo_image = await Jimp.read(LOGO_URL);
                logo_image.resize(60, 60); // 20% ของ QR Code ขนาด 300x300
                const posX = (qr_image.bitmap.width - logo_image.bitmap.width) / 2;
                const posY = (qr_image.bitmap.height - logo_image.bitmap.height) / 2;
                qr_image.composite(logo_image, posX, posY, {
                    mode: Jimp.BLEND_SOURCE_OVER,
                    opacitySource: 1,
                    opacityDest: 1
                });
                logger.info("เพิ่มโลโก้ลงใน QR Code สำเร็จ");
            } catch (error) {
                logger.error(`ไม่สามารถเพิ่มโลโก้ลงใน QR Code ได้: ${error}`);
            }

            // วาง QR Code บนภาพพื้นหลัง
            const qr_position_x = (background_image.bitmap.width - qr_image.bitmap.width) / 2;
            const qr_position_y = (background_image.bitmap.height - qr_image.bitmap.height) / 2;

            // วาดกรอบ QR Code
            const rect_margin = 25;
            background_image.scan(qr_position_x - rect_margin, qr_position_y - rect_margin, qr_image.bitmap.width + rect_margin * 2, qr_image.bitmap.height + rect_margin * 2, function (x, y, idx) {
                this.bitmap.data[idx + 0] = 255; // R
                this.bitmap.data[idx + 1] = 255; // G
                this.bitmap.data[idx + 2] = 255; // B
                this.bitmap.data[idx + 3] = 255; // A
            });

            // วาง QR Code ลงบนภาพพื้นหลัง
            background_image.composite(qr_image, qr_position_x, qr_position_y, {
                mode: Jimp.BLEND_SOURCE_OVER,
                opacitySource: 1,
                opacityDest: 1
            });
            logger.info("วาง QR Code บนภาพพื้นหลังสำเร็จ");

            // เพิ่มข้อความลงบนภาพ
            try {
                const text = `${provider_text}\n\n${instructions}`;
                const lines = textwrap(text, 40);
                let current_y = qr_position_y + qr_image.bitmap.height + 50;

                for (const line of lines) {
                    // วาดข้อความด้วยสีขาว และข้อความโปรด้วยสีเหลือง
                    if (line.includes("V2") && (line.includes("*935*99#") || line.includes("*935*59#") || line.includes("*900*2894#"))) {
                        background_image.print(
                            await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE),
                            400, // x (centered later)
                            current_y,
                            {
                                text: line,
                                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                                alignmentY: Jimp.VERTICAL_ALIGN_TOP
                            },
                            760, // max width
                            0
                        ).color([{ apply: 'xor', params: ['ffffff'] }]); // ทำสีเหลือง
                    } else {
                        background_image.print(
                            await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE),
                            400, // x (centered later)
                            current_y,
                            {
                                text: line,
                                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                                alignmentY: Jimp.VERTICAL_ALIGN_TOP
                            },
                            760, // max width
                            0
                        );
                    }
                    current_y += 40; // เพิ่มระยะห่างระหว่างบรรทัด
                }
                logger.info("เพิ่มข้อความลงบนภาพสำเร็จ");
            } catch (error) {
                logger.error(`ไม่สามารถเพิ่มข้อความลงบนภาพได้: ${error}`);
            }

            // บันทึกภาพ
            const image_buffer = await background_image.getBufferAsync(Jimp.MIME_PNG);
            const file_name = `${code_name}.png`;
            const file_path = path.join(staticDir, file_name);
            fs.writeFileSync(file_path, image_buffer);
            logger.info(`บันทึกภาพ QR Code ที่ ${file_path}`);

            // เตรียมข้อความตอบกลับ
            const tz = 'Asia/Bangkok';
            const current_time = new Date().toLocaleString('en-US', { timeZone: tz });

            const escaped_code_display = (
                `${code_name}\n` +
                `${code_template}\n\n` +
                `🔹 **ผู้ให้บริการเครือข่าย:** \`${provider.toUpperCase()}\`\n` +
                `⚡ **โปรโตคอล:** \`VLESS ผ่าน WebSocket\`\n` +
                `📡 **เซิร์ฟเวอร์:** \`${server_host}\`\n` +
                `🔒 **ระบบความปลอดภัย:** \`เข้ารหัส AES-256\`\n` +
                `🌐 **ประสิทธิภาพเครือข่าย:** \`ปรับแต่งให้เหมาะสมสำหรับความเร็วสูงสุด\`\n\n` +
                `📅 **ดึงโค้ดเมื่อ:** \`${current_time}\` 🕰\n\n` +
                `🤖 **ดึงโค้ดโดยบอท:** \`XCELLENT O5. </>\`\n` +
                `🏷️ **กลุ่ม:** \`CKOI VIP\``
            );

            return { file_name, message: escaped_code_display };
        } else {
            logger.error(`ไม่รู้จักขั้นตอนการสร้างโค้ด: ${current_step}`);
            return null;
        }
    } catch (error) {
        logger.error(`เกิดข้อผิดพลาดในการสร้างโค้ด: ${error}`);
        return null;
    }
}

// ฟังก์ชันตั้งค่าการสร้างโค้ดอัตโนมัติและส่งอัปเดต
function schedule_tasks() {
    // สร้างโค้ดทุก ๆ 4 นาที
    cron.schedule('*/4 * * * *', async () => {
        const result = await generate_code_auto();
        if (result) {
            const { file_name, message } = result;
            const image_url = `https://${process.env.RENDER_INTERNAL_HOSTNAME || 'your-render-service-url'}/static/${file_name}`;

            try {
                await client.pushMessage(LINE_TARGET_ID, [
                    {
                        type: 'text',
                        text: message
                    },
                    {
                        type: 'image',
                        originalContentUrl: image_url,
                        previewImageUrl: image_url
                    }
                ]);
                logger.info(`ส่งโค้ด ${file_name} ไปยังผู้ใช้สำเร็จ`);
            } catch (error) {
                logger.error(`ไม่สามารถส่งข้อความอัปเดตได้: ${error}`);
            }
        }
    });

    // ส่งอัปเดตทุก ๆ 30 วัน
    cron.schedule('0 0 */30 * *', async () => {
        const update_message = (
            `📊 **สรุปจำนวนโค้ดที่สร้างทั้งหมด**\n\n` +
            `🔴 **TRUE V2:** \`${true_v2_count}\` โค้ด\n`
        );

        try {
            await client.pushMessage(LINE_TARGET_ID, {
                type: 'text',
                text: update_message
            });
            logger.info("ส่งข้อความอัปเดตจำนวนโค้ดสำเร็จ");
        } catch (error) {
            logger.error(`ไม่สามารถส่งข้อความอัปเดตได้: ${error}`);
        }
    });

    logger.info("ตั้งเวลาเรียกใช้งานอัตโนมัติสำเร็จ");
}

// ฟังก์ชันแปลงข้อความให้เหมาะสมกับการแสดงผล
function textwrap(text, width) {
    const words = text.split('\n');
    let wrapped = [];

    for (const line of words) {
        const regex = new RegExp(`.{1,${width}}`, 'g');
        const matches = line.match(regex);
        if (matches) {
            wrapped = wrapped.concat(matches);
        } else {
            wrapped.push(line);
        }
    }

    return wrapped;
}

// Route สำหรับ webhook
app.post('/callback', express.json({ verify: (req, res, buf) => { req.rawBody = buf } }), (req, res) => {
    const signature = req.headers['x-line-signature'];

    if (!signature) {
        logger.error("Missing X-Line-Signature.");
        return res.status(400).send('Bad Request');
    }

    // Handle webhook body
    client.parser.parse(req)
        .then(events => {
            events.forEach(async (event) => {
                if (event.type !== 'message' || event.message.type !== 'text') {
                    return;
                }

                const text = event.message.text.toLowerCase();
                const user_id = event.source.userId;

                if (text === 'test') {
                    try {
                        await client.replyMessage(event.replyToken, {
                            type: 'text',
                            text: 'บอททำงานได้ถูกต้อง!'
                        });
                        logger.info("ส่งข้อความทดสอบสำเร็จ");
                    } catch (error) {
                        logger.error(`ไม่สามารถส่งข้อความทดสอบได้: ${error}`);
                    }
                } else if (text.startsWith('/generate')) {
                    // สร้างโค้ดและส่งกลับ
                    const result = await generate_code_auto();
                    if (result) {
                        const { file_name, message } = result;
                        const image_url = `https://${process.env.RENDER_INTERNAL_HOSTNAME || 'your-render-service-url'}/static/${file_name}`;

                        try {
                            await client.replyMessage(event.replyToken, [
                                {
                                    type: 'text',
                                    text: message
                                },
                                {
                                    type: 'image',
                                    originalContentUrl: image_url,
                                    previewImageUrl: image_url
                                }
                            ]);
                            logger.info(`ส่งโค้ด ${file_name} ไปยังผู้ใช้สำเร็จ`);
                        } catch (error) {
                            logger.error(`ไม่สามารถส่งภาพและข้อความได้: ${error}`);
                        }
                    } else {
                        try {
                            await client.replyMessage(event.replyToken, {
                                type: 'text',
                                text: 'ไม่สามารถสร้างโค้ดได้ในขณะนี้ กรุณาลองใหม่ภายหลัง'
                            });
                        } catch (error) {
                            logger.error(`ไม่สามารถส่งข้อความแจ้งเตือนได้: ${error}`);
                        }
                    }
                } else {
                    // ตอบกลับข้อความที่ไม่ได้รับการรองรับ
                    try {
                        await client.replyMessage(event.replyToken, {
                            type: 'text',
                            text: 'คำสั่งของคุณไม่ถูกต้อง กรุณาใช้คำสั่ง /generate หรือ test'
                        });
                        logger.info(`ตอบกลับข้อความไม่ถูกต้องจากผู้ใช้ ${user_id}`);
                    } catch (error) {
                        logger.error(`ไม่สามารถตอบกลับข้อความได้: ${error}`);
                    }
                }
            });

            res.status(200).send('OK');
        })
        .catch(error => {
            logger.error(`Error handling webhook: ${error}`);
            res.status(500).send('Internal Server Error');
        });
});

// Route สำหรับส่งข้อความอัปเดตด้วยตนเอง (ถ้าต้องการ)
app.get('/send_code_count_update', async (req, res) => {
    if (!LINE_TARGET_ID) {
        logger.error("Missing LINE_TARGET_ID.");
        return res.status(400).send("Missing LINE_TARGET_ID.");
    }

    const update_message = (
        `📊 **สรุปจำนวนโค้ดที่สร้างทั้งหมด**\n\n` +
        `🔴 **TRUE V2:** \`${true_v2_count}\` โค้ด\n`
    );

    try {
        await client.pushMessage(LINE_TARGET_ID, {
            type: 'text',
            text: update_message
        });
        logger.info("ส่งข้อความอัปเดตจำนวนโค้ดสำเร็จ");
        res.status(200).send("Update sent.");
    } catch (error) {
        logger.error(`ไม่สามารถส่งข้อความอัปเดตได้: ${error}`);
        res.status(500).send("Failed to send update.");
    }
});

// เริ่ม Scheduler
schedule_tasks();

// เริ่มเว็บเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
