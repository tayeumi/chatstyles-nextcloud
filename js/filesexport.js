const observerFolder = new MutationObserver(() => {
  const info = document.getElementById("app-sidebar-vue");
  if (!info) return;
  const mimetype = info.dataset.mimetype;
  //   console.log("mimetype", mimetype);
  if (mimetype !== "httpd/unix-directory") {
    const menu = document.querySelector(".action-export-custom");
    if (menu) menu.remove();
    return;
  }
  // Tìm tất cả menu context
  const menus = document.getElementById("tab-activity");
  if (!menus) return;
  // Kiểm tra xem đã thêm chưa
  const menu = document.querySelector(".action-export-custom");
  if (menu) return;

  // Tạo element div và chèn vào menu
  const div = document.createElement("div");
  const btn = document.createElement("button");
  div.className = "action action-export-custom";
  div.setAttribute("role", "presentation");
  div.innerHTML = "<hr>Xem thông tin chi tiết upload folder  ";
  // Tạo nút
  btn.innerHTML = `           
                <span class="action-button__longtext-wrapper">
                    <span class="action-button__text"> 
                    <svg fill="currentColor" width="15" height="15" viewBox="0 0 24 24" class="material-design-icon__svg"><path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"><!----></path></svg>
                    Chi tiết</span>
                </span>                   `;

  // Sự kiện click Export
  btn.addEventListener("click", () => {
    showLoading(); // 👈 bật loading ngay lập tức

    const header_folder = document.querySelector(
      ".app-sidebar-header__mainname"
    );
    if (header_folder) {
      const folder_name = header_folder.innerText;
      const folder_id = getFolderIdByName(folder_name);
      // alert("Folder hiện tại: " + folder_name + " - ID: " + folder_id);

      if (folder_id) {
        // Gọi API bên ngoài
        fetch(
          "https://ams.vienthongact.vn/Api/Dms/Report_Groupfolder_Files/" +
            folder_id,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        )
          .then((r) => r.json())
          .then((d) => {
            hideLoading(); // 👈 tắt loading
            // console.log(d);
            if (d && d.O_RESULT === 1 && d.O_DATATABLE.length > 0) {
              // hiện thị thông tin ở đây
              console.log(d);
              showPopup();
              document.getElementById("popupTitle").innerText =
                "Danh sách File & Folder trong '" + folder_name + "'";
              tableDataOriginal = d.O_DATATABLE;
              renderTable(d.O_DATATABLE);
            } else {
              alert("Không có dữ liệu để hiển thị");
            }
          })
          .catch((err) => {
            hideLoading(); // 👈 tắt loading khi lỗi
            console.error(err);
            // alert("Lỗi khi gọi API");
          });
      }
    }
  });
  div.appendChild(btn);
  // Chèn vào cuối menu
  menus.appendChild(div);

  injectPopupHTML();
  injectLoadingOverlay();

  // Gắn sự kiện đóng popup
  document.body.addEventListener("click", function (e) {
    if (e.target.id === "popupCloseBtn") {
      closePopup();
    }
  });

  // Đóng popup khi bấm ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePopup();
    }
  });

  document.body.addEventListener("click", (e) => {
    if (!e.target.closest("th")) return;

    const col = e.target.dataset.col;
    if (!col) return;

    sortAsc = currentSortColumn === col ? !sortAsc : true;
    currentSortColumn = col;

    let sorted = [...tableDataFiltered];

    sorted.sort((a, b) => {
      let v1 = col === "index" ? 0 : a[col];
      let v2 = col === "index" ? 0 : b[col];

      if (col === "upload_time") {
        v1 = new Date(a.upload_time);
        v2 = new Date(b.upload_time);
      }

      if (typeof v1 === "string") v1 = v1.toLowerCase();
      if (typeof v2 === "string") v2 = v2.toLowerCase();

      if (v1 < v2) return sortAsc ? -1 : 1;
      if (v1 > v2) return sortAsc ? 1 : -1;
      return 0;
    });

    renderTable(sorted);
  });

  document.body.addEventListener("click", (e) => {
    if (e.target.id !== "btnExportExcel") return;

    const rows = [
      [
        "STT",
        "Loại",
        "Tên",
        "Kích thước (MB)",
        "Ngày tạo",
        "Tài khoản",
        "Người tạo",
      ],
      ...tableDataFiltered.map((item, i) => [
        i + 1,
        item.file_type === "folder" ? "Thư mục" : "Tệp tin",
        item.name,
        item.size_mb,
        item.file_type === "folder"
          ? "'" + formatDate(item.last_modified)
          : "'" + formatDate(item.upload_time),
        item.create_by,
        item.displayname,
      ]),
    ];

    let csv = rows.map((r) => r.map((x) => `"${x}"`).join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Danh_sach_file.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  //observerFolder.disconnect();
});

function injectPopupHTML() {
  if (document.getElementById("popup_report")) return; // tránh tạo trùng

  const html = `
    <div id="popup_report" class="popup-overlay">
      <div class="popup-box">
        <h3 id="popupTitle">Danh sách File & Folder</h3>     
        <div id="fileList"></div>

        <div class="popup-actions">                    
           <button id="btnExportExcel">Xuất Excel</button>                
           <button id="popupCloseBtn">Đóng</button>
        </div>
      </div>
    </div>

    <style>
      .popup-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.45);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        }
        .popup-box {
        background: #fff;
        width: 90vw;          /* popup chiếm 90% chiều rộng màn hình */
        max-width: 1200px;    /* giới hạn tối đa */
        max-height: 85vh;     /* chiều cao tối đa */
        padding: 20px;
        border-radius: 8px;
        overflow-y: auto;     /* scroll nếu bảng quá dài */
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }

        .popup-box h3 {
        margin-top: 0;
        font-size: 20px;
        margin-bottom: 15px;
        }
      .file-item {
        display: flex;
        gap: 10px;
        padding: 8px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      }
      .file-item:hover {
        background: #f7f7f7;
      }
      .file-icon {
        font-size: 20px;
      }
      .popup-actions {
        margin-top: 15px;
        text-align: right;
      }
        .popup-table {
    width: 100%;
    border-collapse: collapse;
  }
  .popup-table th,
  .popup-table td {
    padding: 8px;
    border-bottom: 1px solid #ddd;
  }
  .popup-table th {
    background: #f3f3f3;
    font-weight: bold;
  }
  .popup-table tr:hover td {
    background: #fafafa;
  }

  .popup-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

#popupSearch {
  width: 65%;
  padding: 6px;
  font-size: 14px;
}

#btnExportExcel:hover {
  background: #005bb5;
}
    </style>
  `;

  document.body.insertAdjacentHTML("beforeend", html);
}

function injectLoadingOverlay() {
  if (document.getElementById("loadingOverlay")) return;

  const html = `
    <div id="loadingOverlay" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">Đang tải dữ liệu...</div>
    </div>

    <style>
      .loading-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.4);
        display: none;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        z-index: 999999;
      }
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 5px solid #fff;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .loading-text {
        margin-top: 10px;
        color: white;
        font-size: 16px;
      }
    </style>
  `;

  document.body.insertAdjacentHTML("beforeend", html);
}

function getFolderIdByName(folderName) {
  // Lấy tất cả các dòng trong danh sách file
  const rows = document.querySelectorAll("tr[data-cy-files-list-row]");

  for (const row of rows) {
    const nameEl = row.querySelector(
      ".files-list__row-name-text .files-list__row-name-"
    );
    if (!nameEl) continue;

    const name = nameEl.textContent.trim();

    if (name === folderName) {
      return row.getAttribute("data-cy-files-list-row-fileid");
    }
  }

  return null;
}

function showLoading() {
  const el = document.getElementById("loadingOverlay");
  if (el) el.style.display = "flex";
}

function hideLoading() {
  const el = document.getElementById("loadingOverlay");
  if (el) el.style.display = "none";
}

function showPopup() {
  document.getElementById("popup_report").style.display = "flex";
}

function closePopup() {
  document.getElementById("popup_report").style.display = "none";
}

let tableDataOriginal = [];
let tableDataFiltered = [];
let currentSortColumn = null;
let sortAsc = true;

function renderTable(data) {
  const container = document.getElementById("fileList");
  if (!container) return;

  tableDataFiltered = data;

  const rows = data
    .map(
      (item, index) => `
    <tr>
      <td style="text-align:center;">${index + 1}</td>
       <td style="text-align:center;"> ${
         item.file_type === "folder" ? "📁" : "📄"
       }</td>
      <td>     
      ${item.name}</td>
      <td style="text-align:right;">${item.size_mb ?? 0} MB</td>
      <td>${
        item.file_type === "folder"
          ? formatDate(item.last_modified)
          : formatDate(item.upload_time)
      }</td>
      <td>${item.create_by}</td>
      <td>${item.displayname}</td>
    </tr>
  `
    )
    .join("");

  const html = `
    <table class="popup-table" id="popupTable">
      <thead>
        <tr>
          <th data-col="index" style="width:50px;text-align:center;">#</th>
          <th data-col="index" style="width:50px;text-align:center;">Loại</th>
          <th data-col="name">Tên</th>
          <th data-col="size_mb" style="width:120px;text-align:right;">Kích thước</th>
          <th data-col="upload_time" style="width:150px;">Ngày tạo</th>
          <th data-col="create_by" style="width:180px;">Tài khoản</th>
          <th data-col="displayname" style="width:180px;">Người tạo</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  container.innerHTML = html;
}

function formatDate(str) {
  if (!str) return "";

  const d = new Date(str);

  const pad = (n) => (n < 10 ? "0" + n : n);

  return (
    pad(d.getDate()) +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    d.getFullYear() +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

observerFolder.observe(document.body, { childList: true, subtree: true });
