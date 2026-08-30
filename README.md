# 🎓 IELTS AI Examiner

> Hệ thống AI tự động chấm và phân tích bài thi **IELTS Writing** & **IELTS Speaking** chuyên sâu, tuân thủ chuẩn xác khung tiêu chí chấm điểm (**Official Band Descriptors / Rubrics**) của Cambridge Assessment English & IDP/British Council.

---

## 📌 Tổng quan dự án

**IELTS AI Examiner** là giải pháp hỗ trợ luyện thi và đánh giá năng lực IELTS ứng dụng trí tuệ nhân tạo (Google Gemini). Không chỉ trả về điểm số tổng quan (Overall Band), hệ thống còn cung cấp báo cáo chi tiết đến từng tiêu chí thành phần, phân tích khoảng cách so với **Target Band**, chỉ ra lỗi ngữ pháp/từ vựng và đề xuất các phương án cải thiện có tính ứng dụng cao.

---

## ✨ Tính năng nổi bật

### 1. ✍️ Chấm điểm IELTS Writing chuẩn Rubric
* **Task 1 (Academic Report / Chart / Map / Diagram)**:
  * Hỗ trợ tải ảnh biểu đồ/bản đồ đi kèm đề bài.
  * Đánh giá 4 tiêu chí cốt lõi: **Task Achievement (TA)**, **Coherence & Cohesion (CC)**, **Lexical Resource (LR)**, **Grammatical Range & Accuracy (GRA)**.
  * Phân tích chi tiết phần Overview, lựa chọn số liệu (Key Features), độ mở rộng thông tin.
* **Task 2 (Academic Essay)**:
  * Đánh giá 4 tiêu chí: **Task Response (TR)**, **Coherence & Cohesion (CC)**, **Lexical Resource (LR)**, **Grammatical Range & Accuracy (GRA)**.
  * Đánh giá tính nhất quán của luận điểm (Position), phát triển ý tưởng (Idea Extension), cấu trúc đoạn văn (Paragraphing) và liên kết câu (Cohesive Devices).
* **Full Test Mode (60 phút làm bài đồng thời cả Task 1 & Task 2)**:
  * Chấm song song cả 2 phần với trọng số chính thức của IELTS:  
    $$\text{Overall Writing Band} = \text{RoundToHalf}\left(\frac{\text{Task 1} \times 1 + \text{Task 2} \times 2}{3}\right)$$
* **Gợi ý cải thiện & Sinh bài mẫu (Sample Essay Generation)**:
  * Chỉ rõ các cụm từ cần nâng cấp (Collocations, Academic Phrases).
  * Hỗ trợ sinh bài viết mẫu (Band 7.0 - 9.0) bám sát đề bài theo yêu cầu.

### 2. 🎙️ Chấm điểm IELTS Speaking
* Ghi âm trực tiếp bài nói trên trình duyệt thông qua **Web Audio API / MediaRecorder**.
* Đánh giá 4 tiêu chí chuẩn IELTS Speaking:
  1. **Fluency and Coherence (FC)**: Độ trôi chảy, mạch lạc, tốc độ nói và độ ngập ngừng.
  2. **Lexical Resource (LR)**: Vốn từ vựng, độ đa dạng và tính tự nhiên.
  3. **Grammatical Range and Accuracy (GRA)**: Mức độ phong phú và độ chính xác của cấu trúc câu.
  4. **Pronunciation (PR)**: Phát âm, ngữ điệu, trọng âm từ và ngắt nhịp.

### 3. 🎯 Phân tích theo Target Band (Target Band Analysis)
* So sánh điểm số thực tế với mục tiêu cá nhân của người học.
* Liệt kê điểm mạnh (**Strengths**) và các lỗ hổng cần khắc phục (**Key Gaps**) để đạt được Band điểm mong muốn.

### 4. 🗄️ Lưu trữ & Theo dõi tiến độ (History & Analytics)
* Lưu trữ toàn bộ lịch sử các lần thi, bài viết, file âm thanh và báo cáo đánh giá vào cơ sở dữ liệu PostgreSQL.
* Xem lại chi tiết từng bài thi và so sánh sự tiến bộ theo thời gian.

---

## 📐 Chuẩn Rubric IELTS được tích hợp

Hệ thống nhúng trực tiếp dữ liệu Rubric chuẩn (Bands 0 - 9) vào Context của mô hình AI:

| Tiêu chí Writing | Mô tả đánh giá |
| :--- | :--- |
| **Task Achievement / Response (TA/TR)** | Trả lời đầy đủ yêu cầu đề bài; có Overview rõ ràng (Task 1); lập trường xuyên suốt và phát triển ý logic (Task 2). |
| **Coherence & Cohesion (CC)** | Tổ chức đoạn văn hợp lý; sử dụng đa dạng và chính xác các từ nối, từ chỉ chiếu (referencing). |
| **Lexical Resource (LR)** | Đa dạng từ vựng; sử dụng từ ngữ học thuật, collocations tự nhiên; kiểm soát tốt lỗi chính tả và cấu tạo từ. |
| **Grammatical Range & Accuracy (GRA)** | Kết hợp linh hoạt giữa câu đơn, câu ghép và câu phức; kiểm soát lỗi ngữ pháp và dấu câu. |

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### **Backend**
* **Runtime**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) (v5)
* **AI Model**: Google Gemini API (`@google/genai` - Gemini 3 Flash / Pro)
* **Database**: [PostgreSQL](https://www.postgresql.org/) (Sử dụng cột `JSONB` cho kết quả chi tiết & feedback)
* **File & Media Handling**: [Multer](https://github.com/expressjs/multer) (Upload ảnh đề bài & file âm thanh bài nói)
* **Khác**: `dotenv`, `cors`, `nodemon`, `pdf-parse`

### **Frontend**
* **Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Routing**: [React Router DOM v7](https://reactrouter.com/)
* **HTTP Client**: [Axios](https://axios-http.com/)
* **Styling**: Vanilla Modular CSS (Hỗ trợ Dark/Light Theme, hiệu ứng Glassmorphism và Responsive Layout)

---

## 📂 Cấu trúc thư mục dự án

```plaintext
IELTS_App/
├── backend/                        # Backend REST API server
│   ├── controller/                 # Controllers xử lý logic request
│   ├── routes/                     # Định nghĩa API routes
│   ├── service/                    # Xử lý nghiệp vụ chính
│   ├── public/uploads/             # Nơi lưu trữ ảnh đề bài và audio ghi âm
│   ├── db.js                       # Kết nối PostgreSQL
│   ├── migrate.js                  # Script khởi tạo/reset cơ sở dữ liệu
│   ├── server.js                   # Entry point backend
│   └── package.json
│
├── frontend/                       # Giao diện người dùng (React + Vite)
│   ├── src/
│   │   ├── components/             # Các components dùng chung (LoadingSteps, Navbar, ...)
│   │   ├── pages/                  # Các màn hình chín
│   │   ├── style/                  # CSS modules / Stylesheet cho từng trang
│   │   ├── App.jsx                 # Routing cấu hình
│   │   └── main.jsx
│   └── package.json
│
├── db/                             # Tài nguyên cơ sở dữ liệu & Rubrics
│   ├── access/                     # JSON Rubrics & PDF Band Descriptors chính thức
│   └── db.sql                      # Schema khởi tạo database
│
├── agent-skills/                   # 24 quy chuẩn kỹ thuật & workflow phát triển phần mềm
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt & Chạy dự án

### 1. Yêu cầu môi trường
* **Node.js**: Phiên bản `>= 18.x` (khuyến nghị Node.js 20+)
* **PostgreSQL**: Phiên bản `>= 14.x`
* **Google Gemini API Key**: Lấy tại [Google AI Studio](https://aistudio.google.com/)

---

### 2. Cấu hình Cơ sở dữ liệu (Database)

1. Tạo database mới trong PostgreSQL (ví dụ: `MyExaminer`):
   ```sql
   CREATE DATABASE "MyExaminer";
   ```
2. Cấu hình thông tin kết nối trong file `backend/.env`.

---

### 3. Cấu hình biến môi trường (Environment Variables)

Tạo file `backend/.env` với nội dung tương tự mẫu sau:

```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=MyExaminer
DB_PASSWORD=your_postgres_password
DB_PORT=5432
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### 4. Khởi tạo Database & Chạy Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Chạy migration để tạo bảng
node migrate.js

# Chạy server ở chế độ development
npm run dev
```
> Server Backend sẽ lắng nghe tại: `http://localhost:5000`

---

### 5. Khởi động Frontend

Mở một terminal mới:

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Khởi chạy Vite dev server
npm run dev
```
> Ứng dụng Web sẽ mở tại: `http://localhost:5173`

---

## 📡 Danh sách API Endpoints chính

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/assessments/submit` | Nộp bài Writing (Task 1 / Task 2 / Full Test) hoặc Speaking (audio) để chấm điểm |
| `POST` | `/api/assessments/upload-image` | Tải lên hình ảnh đề bài (dùng cho Task 1) |
| `POST` | `/api/assessments/generate-sample` | Yêu cầu AI sinh bài viết mẫu (Band 7.0 - 9.0) |
| `POST` | `/api/assessments/:id/generate-sample` | Sinh bài mẫu dựa trên bài nộp đã có sẵn trong hệ thống |
| `GET` | `/api/assessments` | Lấy danh sách tất cả các bài nộp trong lịch sử |
| `GET` | `/api/assessments/:id` | Xem chi tiết kết quả bài nộp theo ID |
| `GET` | `/api/questions` | Lấy danh sách đề bài có sẵn trong ngân hàng câu hỏi |

---

## 🛡️ Tiêu chuẩn phát triển (Engineering Standards)

Dự án được xây dựng và tuân thủ 24 bộ kỹ năng kỹ thuật trong thư mục `agent-skills/`, đảm bảo:
* **Chính xác (Correctness)**: Đánh giá nhất quán theo chuẩn IELTS Band Descriptors.
* **Bảo mật (Security)**: Xử lý an toàn file upload, kiểm soát tham số truy vấn SQL qua `pg`.
* **Hiệu năng & Trải nghiệm (Performance & UX)**: Phản hồi song song đa luồng khi chấm Full Test, giao diện phản hồi nhanh và thân thiện với người học.

---

## 📄 Bản quyền (License)

Dự án phát triển phục vụ mục đích học tập và nghiên cứu công nghệ AI trong giáo dục. Mọi tài liệu chuẩn IELTS thuộc bản quyền của **Cambridge University Press & Assessment / IDP Education / British Council**.