# Luồng Logic và Tương tác Phân hệ (System Logic & Modules)

Tài liệu này tập trung giải thích **luồng truyền tải dữ liệu, logic nghiệp vụ** và cách các phân hệ trong hệ thống tương tác với nhau.

---

## 1. Sơ đồ Luồng Hoạt động Tổng thể (Global Workflow)

Hệ thống quản lý vòng đời của vật tư từ lúc nhập kho nguyên liệu cho đến khi xuất thành phẩm (Kho Bán Thành Phẩm). Dưới đây là sơ đồ phối hợp giữa 4 module chính: Kho -> Đơn Tổng -> Sản Xuất -> BTP.

```mermaid
graph TD
    %% Định nghĩa các node
    NCC["Nhà Cung Cấp"]
    KhoNL["Phân hệ Kho Nguyên Liệu"]
    DonTong["Phân hệ Đơn Tổng"]
    SanXuat["Phân hệ Sản Xuất"]
    KhoBTP["Kho Bán Thành Phẩm"]
    KhachHang["Khách Hàng"]

    %% Luồng dữ liệu
    NCC -- "Giao hàng" --> KhoNL
    KhoNL -- "Nhập kho (Tạo Lô Sổ cái)" --> KhoNL
    KhoNL -- "Tồn kho chưa phân" --> DonTong
    DonTong -- "Cấp phát (Allocation)" --> DonTong
    DonTong -- "Xác nhận Phát liệu" --> SanXuat
    SanXuat -- "Sản xuất Công hàng (Chưa làm -> Đang làm)" --> SanXuat
    SanXuat -- "Hoàn thành (Đã làm)" --> KhoBTP
    KhoBTP -- "Tồn kho BTP" --> KhoBTP
    KhoBTP -- "Xuất giao hàng" --> KhachHang
```

---

## 2. Chi tiết Logic: Phân hệ Kho Nguyên Liệu

**Mục tiêu:** Quản lý nhập/xuất vật tư theo lô (batch-tracking) đảm bảo truy xuất nguồn gốc chính xác.

### Thuật toán Cập nhật Tồn kho
Hệ thống sử dụng cơ chế **Sổ cái (Ledger)**. Mọi thao tác đều tạo ra một record (Giao dịch) mới với số dư cuối (`so_luong_ton_cuoi`).
- Tránh việc tính toán `SUM(nhap) - SUM(xuat)` mỗi lần lấy tồn kho.
- Lấy tồn kho hiện tại chỉ bằng cách truy vấn Record mới nhất của mỗi vật tư: `DISTINCT ON (nguyen_lieu_id) ... ORDER BY created_at DESC`.

```mermaid
sequenceDiagram
    participant User as Người dùng (Client)
    participant Server as Server Actions
    participant DB as Sổ cái Vật tư (DB)
    
    User->>Server: Submit Form Nhập/Xuất kho
    Server->>DB: Lấy Tồn cuối hiện tại (Ton_Cu)
    alt Là phiếu Nhập
        Server->>Server: Ton_Moi = Ton_Cu + So_Luong
    else Là phiếu Xuất
        Server->>Server: Ton_Moi = Ton_Cu - So_Luong
    end
    Server->>DB: INSERT Giao dịch mới (kèm Ton_Moi)
    DB-->>Server: Trả về thành công
    Server-->>User: Hiển thị thông báo (Realtime tự động fetch lại)
```

---

## 3. Chi tiết Logic: Phân hệ Đơn Tổng (Master Orders)

**Mục tiêu:** Phân bổ vật tư tồn kho cho các kế hoạch sản xuất cụ thể. Giúp quản lý xem Đơn tổng này đã gom đủ vật tư để tiến hành sản xuất chưa.

### Thuật toán Số dư Động (Tồn chưa phân)
Một Lô Nhập Kho có số lượng X. Khi rót vào Đơn tổng 1 lượng Y, hệ thống không trừ trực tiếp vào Tồn kho (vì hàng vẫn nằm trong kho), mà ghi nhận một liên kết `Lô Giao Dịch` <-> `Đơn Tổng Chi Tiết`.
`Tồn chưa phân của Lô` = `Số lượng Lô` - `SUM(Các lần đã cấp phát cho mọi Đơn tổng)`.

```mermaid
graph TD
    Start("Bắt đầu Cấp phát") --> FetchLo["Truy vấn các Lô giao dịch Nhập kho của vật tư"]
    FetchLo --> TinhTon["Tính 'Tồn chưa phân' cho mỗi lô"]
    TinhTon --> HienThi["Hiển thị danh sách Lô trên Popup"]
    HienThi --> UserInput["Người dùng nhập số lượng cần cấp"]
    UserInput --> CheckTon{"Số lượng <= Tồn chưa phân?"}
    
    CheckTon -- "Hợp lệ" --> DBInsert["Ghi nhận dòng Cấp phát vào 'Lô Giao Dịch' có link tới 'Đơn Tổng'"]
    DBInsert --> UpdatePercent["Tính lại % hoàn thành của Đơn tổng"]
    UpdatePercent --> Finish("Hoàn tất")
    
    CheckTon -- "Không hợp lệ" --> Error["Báo lỗi vượt quá tồn chưa phân"]
```

---

## 4. Chi tiết Logic: Phân hệ Sản Xuất

**Mục tiêu:** Quản lý vòng đời chế tạo của từng **Công hàng** (Mã hàng sản xuất cụ thể).

```mermaid
stateDiagram-v2
    [*] --> CHUA_LAM: Khởi tạo Công hàng
    
    CHUA_LAM --> DANG_LAM: Xác nhận Phát liệu (Từ Đơn tổng chuyển xuống)
    DANG_LAM --> DA_LAM: Báo cáo Hoàn thành
    
    DA_LAM --> [*]: Tự động chuyển sang Kho BTP
```

---

## 5. Luồng Xử lý Đa phương tiện (Media Upload)

Tất cả các giao dịch (Nhập/Xuất, Chuyển trạng thái) đều yêu cầu hình ảnh minh chứng. Dữ liệu ảnh được lưu trực tiếp vào trường JSONB trong Database để tránh việc tạo bảng phụ cồng kềnh.

```mermaid
sequenceDiagram
    participant App as Ứng dụng Client
    participant Cloud as Cloudinary
    participant DB as Supabase DB

    App->>Cloud: Mở Camera & Upload (Secure Widget)
    Cloud-->>App: Trả về URL & Public ID
    App->>App: Đóng gói thành mảng JSON [{url, public_id}]
    App->>DB: Gửi kèm theo payload Giao dịch (Server Actions)
    DB-->>App: Lưu JSONB vào dòng dữ liệu tương ứng
```
