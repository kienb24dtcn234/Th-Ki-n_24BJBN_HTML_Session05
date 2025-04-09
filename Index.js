// 1. Chức năng đăng xuất
function exit() {
    let selectElement = document.getElementById("select");
    if (selectElement.value === "logout") {
        document.getElementById("confirmModal").style.display = "flex";
    }
}

function confirmLogout() {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}

function closeModal() {
    document.getElementById("confirmModal").style.display = "none";
    document.getElementById("select").value = "";
}

// 2. Khai báo biến toàn cục với let
let monthlyCategories = [];
let transactions = [];
let monthlyReports = [];
let remainingBalance = 0;
let userId = 1;
let currentEditIndex = -1;
let currentPage = 1;
let itemsPerPage = 5;
let sortAscending = true;

// 3. Tải dữ liệu khi trang được tải
window.onload = function() {
    let savedMonthlyCategories = localStorage.getItem("monthlyCategories");
    let savedTransactions = localStorage.getItem("transactions");
    let savedMonthlyReports = localStorage.getItem("monthlyReports");

    if (savedMonthlyCategories) {
        monthlyCategories = JSON.parse(savedMonthlyCategories);
    }
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
    if (savedMonthlyReports) {
        monthlyReports = JSON.parse(savedMonthlyReports);
    }

    // Gọi các hàm cập nhật giao diện
    checkAndUpdateBalance();
    loadCategoriesIntoSelect();
    loadCategories();
    displayTransactions();

    // Thêm sự kiện lắng nghe khi tháng thay đổi
    document.querySelector(".month").addEventListener("change", function() {
        checkAndUpdateBalance();
        loadCategoriesIntoSelect();
        loadCategories();
        displayTransactions();
    });
};

// 4. Lưu ngân sách mới
document.getElementById("saveButton").onclick = function() {
    let moneyInput = document.querySelector(".money").value;
    let monthInput = document.querySelector(".month").value;

    if (!moneyInput) {
        alert("Vui lòng nhập số tiền.");
        return;
    }

    let budgetValue = parseInt(moneyInput);
    if (isNaN(budgetValue) || budgetValue <= 0) {
        alert("Vui lòng nhập số tiền hợp lệ.");
        return;
    }

    // Tìm xem tháng đã tồn tại chưa
    let existingMonthIndex = monthlyCategories.findIndex(entry => entry.month === monthInput);
    if (existingMonthIndex !== -1) {
        // Cập nhật ngân sách cho tháng đã tồn tại
        monthlyCategories[existingMonthIndex].amount = budgetValue;
    } else {
        // Tạo mới tháng với danh mục rỗng
        let newId = (monthlyCategories.length + 1).toString();
        let budgetEntry = {
            id: newId,
            month: monthInput,
            categories: [],
            amount: budgetValue
        };
        monthlyCategories.push(budgetEntry);
    }

    localStorage.setItem("monthlyCategories", JSON.stringify(monthlyCategories));
    document.querySelector(".money").value = "";
    
    // Cập nhật số dư ngay sau khi lưu ngân sách
    checkAndUpdateBalance();
    loadCategories();
    loadCategoriesIntoSelect();
};

// 5. Quản lý danh mục
function loadCategories() {
    let monthInput = document.querySelector(".month").value;
    let table = document.getElementById("categoryTable");
    table.innerHTML = "";

    let monthEntry = monthlyCategories.find(entry => entry.month === monthInput);
    let categoriesToShow = monthEntry ? monthEntry.categories : [];

    categoriesToShow.forEach((category, i) => {
        let row = document.createElement("tr");
        let cell1 = document.createElement("td");
        cell1.textContent = `${category.name} - Giới hạn: ${category.budget} VND`;
        row.appendChild(cell1);

        let cell2 = document.createElement("td");
        let editButton = document.createElement("button");
        editButton.textContent = "Sửa";
        editButton.className = "edit-button";
        editButton.onclick = () => openEditForm(i);
        cell2.appendChild(editButton);
        row.appendChild(cell2);

        let cell3 = document.createElement("td");
        let deleteButton = document.createElement("button");
        deleteButton.textContent = "Xóa";
        deleteButton.className = "delete-button";
        deleteButton.onclick = () => deleteCategory(i);
        cell3.appendChild(deleteButton);
        row.appendChild(cell3);

        table.appendChild(row);
    });
}

function getCategoryLimit(categoryName) {
    let monthInput = document.querySelector(".month").value;
    let monthEntry = monthlyCategories.find(entry => entry.month === monthInput);
    if (monthEntry) {
        let category = monthEntry.categories.find(cat => cat.name === categoryName);
        return category ? category.budget : 0;
    }
    return 0;
}

function addCategory() {
    let nameInput = document.getElementById("categoryName");
    let limitInput = document.getElementById("categoryLimit");
    let name = nameInput.value.trim();
    let limit = limitInput.value.trim();
    let monthInput = document.querySelector(".month").value;

    if (!name || !limit) {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    if (!monthInput) {
        alert("Vui lòng chọn tháng trước khi thêm danh mục");
        return;
    }

    let limitValue = parseInt(limit);
    if (isNaN(limitValue) || limitValue <= 0) {
        alert("Vui lòng nhập số tiền hợp lệ");
        return;
    }

    let monthEntry = monthlyCategories.find(entry => entry.month === monthInput);
    if (!monthEntry) {
        alert("Tháng này chưa được thiết lập ngân sách. Vui lòng thiết lập trước.");
        return;
    }

    if (monthEntry.categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
        alert(`Danh mục "${name}" đã tồn tại trong tháng này. Vui lòng chọn tên khác.`);
        return;
    }

    let newCategory = {
        id: monthEntry.categories.length + 1,
        name: name,
        budget: limitValue
    };
    monthEntry.categories.push(newCategory);

    localStorage.setItem("monthlyCategories", JSON.stringify(monthlyCategories));
    loadCategories();
    nameInput.value = "";
    limitInput.value = "";
    loadCategoriesIntoSelect();
}

function openEditForm(index) {
    let monthInput = document.querySelector(".month").value;
    let monthEntry = monthlyCategories.find(entry => entry.month === monthInput);
    if (!monthEntry) {
        alert("Tháng này chưa được thiết lập ngân sách. Vui lòng thiết lập trước.");
        return;
    }

    currentEditIndex = index;
    document.getElementById("editCategoryName").value = monthEntry.categories[index].name;
    document.getElementById("editCategoryLimit").value = monthEntry.categories[index].budget;
    document.getElementById("editForm").style.display = "block";
}

function saveEditCategory() {
    let newName = document.getElementById("editCategoryName").value;
    let newLimit = document.getElementById("editCategoryLimit").value;
    let monthInput = document.querySelector(".month").value;

    if (!newName || !newLimit) {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    let limitValue = parseInt(newLimit);
    if (isNaN(limitValue) || limitValue <= 0) {
        alert("Vui lòng nhập số tiền hợp lệ");
        return;
    }

    let monthEntry = monthlyCategories.find(entry => entry.month === monthInput);
    if (!monthEntry) return;

    monthEntry.categories[currentEditIndex].name = newName;
    monthEntry.categories[currentEditIndex].budget = limitValue;

    localStorage.setItem("monthlyCategories", JSON.stringify(monthlyCategories));
    loadCategories();
    document.getElementById("editForm").style.display = "none";
    loadCategoriesIntoSelect();
}

function cancelEditCategory() {
    document.getElementById("editForm").style.display = "none";
}

function deleteCategory(index) {
    let monthInput = document.querySelector(".month").value;
    let monthEntry = monthlyCategories.find(entry => entry.month === monthInput);
    if (!monthEntry) return;

    monthEntry.categories.splice(index, 1);
    monthEntry.categories = monthEntry.categories.map((cat, idx) => ({
        id: idx + 1,
        name: cat.name,
        budget: cat.budget
    }));

    localStorage.setItem("monthlyCategories", JSON.stringify(monthlyCategories));
    loadCategories();
    loadCategoriesIntoSelect();
}

// 6. Quản lý giao dịch
function loadCategoriesIntoSelect() {
    let monthInput = document.querySelector(".month").value;
    let monthEntry = monthlyCategories.find(entry => entry.month === monthInput);
    let categories = monthEntry ? monthEntry.categories : [];

    let select = document.getElementById("categorySelect");
    select.innerHTML = "";
    let defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Tiền chi tiêu";
    select.appendChild(defaultOption);

    categories.forEach((category) => {
        let option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

function addTransaction() {
    let categoryId = document.getElementById("categorySelect").value;
    let amount = document.getElementById("transactionAmount").value;
    let note = document.getElementById("transactionNote").value;
    let monthInput = document.querySelector(".month").value;

    if (!categoryId || !amount || !note) {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    if (!monthInput) {
        alert("Vui lòng chọn tháng trước khi thêm giao dịch");
        return;
    }

    let amountValue = parseInt(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
        alert("Vui lòng nhập số tiền hợp lệ.");
        return;
    }

    let monthEntry = monthlyCategories.find(entry => entry.month === monthInput);
    if (!monthEntry) {
        alert("Tháng này chưa được thiết lập ngân sách. Vui lòng thiết lập trước.");
        return;
    }
    let monthCategoryId = monthEntry.id;

    let transaction = {
        id: transactions.length + 1,
        date: new Date().toISOString().split('T')[0],
        amount: amountValue,
        description: note,
        categoryId: parseInt(categoryId),
        monthCategoryId: parseInt(monthCategoryId)
    };
    transactions.push(transaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    updateMonthlyReports(monthInput, parseInt(categoryId), amountValue);
    checkCategoryLimit(parseInt(categoryId), amountValue);
    checkAndUpdateBalance();

    displayTransactions();
    document.getElementById("categorySelect").value = "";
    document.getElementById("transactionAmount").value = "";
    document.getElementById("transactionNote").value = "";
}

function updateMonthlyReports(month, categoryId, amount) {
    let reportIndex = monthlyReports.findIndex(report => report.userId === userId && report.month === month);
    if (reportIndex === -1) {
        monthlyReports.push({
            userId: userId,
            month: month,
            totalAmount: amount,
            details: [{ categoryId: categoryId, amount: amount }]
        });
    } else {
        monthlyReports[reportIndex].totalAmount += amount;
        let detailIndex = monthlyReports[reportIndex].details.findIndex(detail => detail.categoryId === categoryId);
        if (detailIndex === -1) {
            monthlyReports[reportIndex].details.push({ categoryId: categoryId, amount: amount });
        } else {
            monthlyReports[reportIndex].details[detailIndex].amount += amount;
        }
    }
    localStorage.setItem("monthlyReports", JSON.stringify(monthlyReports));
}

function checkCategoryLimit(categoryId, amount) {
    let monthInput = document.querySelector(".month").value;
    let monthEntry = monthlyCategories.find(entry => entry.month === monthInput);
    if (!monthEntry) return;

    let matchedCategory = monthEntry.categories.find(cat => cat.id === categoryId);
    if (matchedCategory) {
        let totalSpent = transactions
            .filter(t => t.categoryId === categoryId)
            .reduce((sum, t) => sum + t.amount, 0);
        if (totalSpent > matchedCategory.budget) {
            document.getElementById("notification").innerHTML = `<p>Danh mục "${matchedCategory.name}" đã vượt giới hạn: ${totalSpent}/${matchedCategory.budget} VND</p>`;
        }
    }
}

function checkAndUpdateBalance() {
    let monthInput = document.querySelector(".month").value;
    let monthEntry = monthlyCategories.find(entry => entry.month === monthInput);
    let budget = monthEntry ? monthEntry.amount : 0;

    let totalSpent = transactions
        .filter(t => {
            let transactionMonth = monthlyCategories.find(entry => entry.id === t.monthCategoryId.toString());
            return transactionMonth && transactionMonth.month === monthInput;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    remainingBalance = budget - totalSpent;

    let changeElement = document.querySelector(".change");
    let notificationElement = document.getElementById("notification");

    if (remainingBalance < 0) {
        changeElement.textContent = `${remainingBalance} VND`;
        changeElement.style.color = "red";
        notificationElement.innerHTML = `<p style="color: red">Cảnh báo: Tổng chi tiêu vượt quá ngân sách: ${Math.abs(remainingBalance)} VND</p>`;
    } else {
        changeElement.textContent = `${remainingBalance} VND`;
        changeElement.style.color = "green";
        notificationElement.innerHTML = `<p>Số dư còn lại: ${remainingBalance} VND</p>`;
    }
}

function displayTransactions(filteredTransactions = transactions) {
    let monthInput = document.querySelector(".month").value;
    let table = document.getElementById("transactionTable");
    table.innerHTML = "";

    let start = (currentPage - 1) * itemsPerPage;
    let end = start + itemsPerPage;

    let monthFilteredTransactions = filteredTransactions.filter(t => {
        let transactionMonth = monthlyCategories.find(entry => entry.id === t.monthCategoryId.toString());
        return transactionMonth && transactionMonth.month === monthInput;
    });

    let paginatedTransactions = monthFilteredTransactions.slice(start, end);

    let monthEntry = monthlyCategories.find(entry => entry.month === monthInput);
    let categories = monthEntry ? monthEntry.categories : [];

    paginatedTransactions.forEach((transaction, i) => {
        let globalIndex = start + i;
        let categoryName = categories.find(cat => cat.id === transaction.categoryId)?.name || "Unknown";
        let row = document.createElement("tr");
        row.className = "lichsu";
        row.innerHTML = `<td>${categoryName} - ${transaction.description}: ${transaction.amount.toLocaleString()} VND</td>
                         <td><p onclick="deleteTransaction(${globalIndex})">Xóa</p></td>`;
        table.appendChild(row);
    });

    updatePagination(monthFilteredTransactions);
}

function updatePagination(filteredTransactions) {
    let totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    let pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    let prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.className = "nav-button";
    prevButton.onclick = previousPage;
    prevButton.disabled = currentPage === 1;
    pagination.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        let pageButton = document.createElement("button");
        pageButton.textContent = i;
        pageButton.onclick = () => goToPage(i);
        if (i === currentPage) pageButton.className = "active";
        pagination.appendChild(pageButton);
    }

    let nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.className = "nav-button";
    nextButton.onclick = nextPage;
    nextButton.disabled = currentPage === totalPages;
    pagination.appendChild(nextButton);
}

function goToPage(page) {
    currentPage = page;
    displayTransactions();
}

function deleteTransaction(index) {
    let monthInput = document.querySelector(".month").value;
    let monthFilteredTransactions = transactions.filter(t => {
        let transactionMonth = monthlyCategories.find(entry => entry.id === t.monthCategoryId.toString());
        return transactionMonth && transactionMonth.month === monthInput;
    });

    let globalIndex = (currentPage - 1) * itemsPerPage + index;
    let transaction = monthFilteredTransactions[index];
    let transactionIndex = transactions.findIndex(t => t.id === transaction.id);

    transactions.splice(transactionIndex, 1);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    let reportIndex = monthlyReports.findIndex(report => report.userId === userId && report.month === monthInput);
    if (reportIndex !== -1) {
        let detailIndex = monthlyReports[reportIndex].details.findIndex(detail => detail.categoryId === transaction.categoryId);
        if (detailIndex !== -1) {
            monthlyReports[reportIndex].totalAmount -= transaction.amount;
            monthlyReports[reportIndex].details[detailIndex].amount -= transaction.amount;
            if (monthlyReports[reportIndex].details[detailIndex].amount <= 0) {
                monthlyReports[reportIndex].details.splice(detailIndex, 1);
            }
            if (monthlyReports[reportIndex].totalAmount <= 0) {
                monthlyReports.splice(reportIndex, 1);
            }
        }
    }
    localStorage.setItem("monthlyReports", JSON.stringify(monthlyReports));

    checkAndUpdateBalance();
    displayTransactions();
}

function searchTransactions() {
    let searchTerm = document.getElementById("searchInput").value.toLowerCase().trim();
    let filteredTransactions = transactions.filter(t => t.description.toLowerCase().includes(searchTerm));

    if (filteredTransactions.length === 0) {
        document.getElementById("transactionTable").innerHTML = "<tr><td colspan='2'>Không tìm thấy giao dịch nào.</td></tr>";
        document.getElementById("pagination").innerHTML = "";
    } else {
        currentPage = 1;
        displayTransactions(filteredTransactions);
    }
}

function toggleSortTransactions() {
    sortAscending = !sortAscending;
    transactions.sort((a, b) => sortAscending ? a.amount - b.amount : b.amount - a.amount);
    displayTransactions();
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayTransactions();
    }
}

function nextPage() {
    if (currentPage < Math.ceil(transactions.length / itemsPerPage)) {
        currentPage++;
        displayTransactions();
    }
}