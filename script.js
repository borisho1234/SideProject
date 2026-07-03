// ==================== 全局變數 ====================
let currentBalance = 52800.00;
let transactions = [];
let favorites = [
    { name: "陳美玲", account: "234-567890-112" },
    { name: "李志明", account: "345-112233-445" }
];

let accounts = [
    { id: 1, name: "主要往來帳戶", accountNumber: "123-456789-001", balance: 52800, type: "checking" },
    { id: 2, name: "儲蓄帳戶", accountNumber: "123-456789-002", balance: 125000, type: "savings" }
];
let currentAccountId = 1;

let DAILY_LIMIT = 100000;
let loginAttempts = 0;
let sessionTimeout;

// ==================== 資料持久化 ====================
function saveData() {
    localStorage.setItem('bankBalance', currentBalance.toString());
    localStorage.setItem('bankTransactions', JSON.stringify(transactions));
    localStorage.setItem('bankFavorites', JSON.stringify(favorites));
}

function loadData() {
    const savedBalance = localStorage.getItem('bankBalance');
    if (savedBalance) currentBalance = parseFloat(savedBalance);

    const savedTx = localStorage.getItem('bankTransactions');
    if (savedTx) transactions = JSON.parse(savedTx);

    const savedFav = localStorage.getItem('bankFavorites');
    if (savedFav) favorites = JSON.parse(savedFav);
}

function saveAccounts() {
    localStorage.setItem('bankAccounts', JSON.stringify(accounts));
    localStorage.setItem('currentAccountId', currentAccountId);
}

function loadAccounts() {
    const savedAccounts = localStorage.getItem('bankAccounts');
    const savedId = localStorage.getItem('currentAccountId');

    if (savedAccounts) accounts = JSON.parse(savedAccounts);
    if (savedId) currentAccountId = parseInt(savedId);
}

// ==================== 工具函數 ====================
function getCurrentAccount() {
    return accounts.find(acc => acc.id === currentAccountId);
}

function formatCurrency(amount) {
    return amount.toLocaleString('en-HK', { minimumFractionDigits: 2 });
}

function updateBalance() {
    const account = getCurrentAccount();
    if (!account) return;

    const el = document.getElementById('balance');
    if (el) el.textContent = formatCurrency(account.balance);

    const nameEl = document.getElementById('currentAccountName');
    const numberEl = document.getElementById('currentAccountNumber');
    if (nameEl) nameEl.textContent = account.name;
    if (numberEl) numberEl.textContent = account.accountNumber;
}

// ==================== 每日限額 ====================
function getTodayTransferredAmount() {
    const today = new Date().toISOString().slice(0, 10);
    const transfers = JSON.parse(localStorage.getItem('dailyTransfers') || '{}');
    return transfers[today] || 0;
}

function addToDailyTransfer(amount) {
    const today = new Date().toISOString().slice(0, 10);
    let transfers = JSON.parse(localStorage.getItem('dailyTransfers') || '{}');
    transfers[today] = (transfers[today] || 0) + amount;
    localStorage.setItem('dailyTransfers', JSON.stringify(transfers));
}

function updateDailyLimitUI() {
    const transferred = getTodayTransferredAmount();
    const remaining = DAILY_LIMIT - transferred;
    const percentage = Math.min(Math.round((transferred / DAILY_LIMIT) * 100), 100);

    // 轉帳頁
    const textEl = document.getElementById('dailyLimitText');
    const remainingEl = document.getElementById('dailyLimitRemaining');
    const barEl = document.getElementById('dailyLimitBar');
    if (textEl) textEl.textContent = `HK$ ${transferred.toLocaleString()} / ${DAILY_LIMIT.toLocaleString()}`;
    if (remainingEl) remainingEl.textContent = `剩餘可轉：HK$ ${remaining.toLocaleString()}`;
    if (barEl) barEl.style.width = `${percentage}%`;

    // Dashboard
    const dashText = document.getElementById('dashboardDailyText');
    const dashPercent = document.getElementById('dashboardDailyPercent');
    const dashBar = document.getElementById('dashboardDailyBar');
    if (dashText) dashText.textContent = `HK$ ${transferred.toLocaleString()} / ${DAILY_LIMIT.toLocaleString()}`;
    if (dashPercent) dashPercent.textContent = `${percentage}%`;
    if (dashBar) dashBar.style.width = `${percentage}%`;

    // Header
    const headerUsed = document.getElementById('headerDailyUsed');
    if (headerUsed) headerUsed.textContent = transferred.toLocaleString();
}

function resetDailyLimit() {
    if (!confirm('確定要重置今日轉帳金額嗎？（Demo 專用）')) return;

    const today = new Date().toISOString().slice(0, 10);
    let transfers = JSON.parse(localStorage.getItem('dailyTransfers') || '{}');
    transfers[today] = 0;
    localStorage.setItem('dailyTransfers', JSON.stringify(transfers));

    updateDailyLimitUI();
    alert('今日轉帳金額已重置！');
}

function showDailyLimitDetail() {
    const transferred = getTodayTransferredAmount();
    const remaining = DAILY_LIMIT - transferred;
    const percentage = Math.round((transferred / DAILY_LIMIT) * 100);

    const message = 
        `今日轉帳情況\n\n` +
        `已轉出：HK$${transferred.toLocaleString()}\n` +
        `剩餘可轉：HK$${remaining.toLocaleString()}\n` +
        `使用比例：${percentage}%\n\n` +
        `每日限額：HK$${DAILY_LIMIT.toLocaleString()}`;

    alert(message);
}

// ==================== 常用收款人 ====================
function renderFavorites() {
    const container = document.getElementById('favoriteList');
    if (!container) return;
    container.innerHTML = '';
    
    favorites.forEach(fav => {
        const btn = document.createElement('button');
        btn.className = 'px-4 py-2 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 rounded-2xl text-sm flex items-center gap-x-2 transition';
        btn.innerHTML = `
            <div class="text-left">
                <div class="font-medium text-sm">${fav.name}</div>
                <div class="font-mono text-[10px] text-zinc-400">${fav.account}</div>
            </div>
        `;
        btn.onclick = () => {
            document.getElementById('recipientAccount').value = fav.account;
            document.getElementById('recipientName').value = fav.name;
            document.getElementById('amount').focus();
        };
        container.appendChild(btn);
    });
}

// ==================== 快速金額 ====================
function quickAmount(amount) {
    const input = document.getElementById('amount');
    if (input) {
        input.value = amount;
        input.focus();
    }
}

// ==================== Tab 切換 ====================
function switchTab(tabIndex) {
    document.querySelectorAll('[id^="tab-content-"]').forEach(el => {
        if (el) el.classList.add('hidden');
    });
    document.querySelectorAll('[id^="tab-"]').forEach(el => {
        if (el) el.classList.remove('active', 'text-[#003087]', 'border-b-2', 'border-[#003087]');
    });
    
    const content = document.getElementById(`tab-content-${tabIndex}`);
    if (content) content.classList.remove('hidden');
    
    const activeTab = document.getElementById(`tab-${tabIndex}`);
    if (activeTab) activeTab.classList.add('active', 'text-[#003087]', 'border-b-2', 'border-[#003087]');
    
    if (tabIndex === 2) renderHistory();
    if (tabIndex === 0) updateDailyLimitUI();
}

// ==================== 登入 / 註冊 ====================
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('mainApp');

    if (isLoggedIn === 'true') {
        loginPage.classList.add('hidden');
        mainApp.classList.remove('hidden');
    } else {
        loginPage.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
}

function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    let users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const user = users.find(u => u.username === username && u.password === password);

    if (user || (username === 'boris' && password === '123456')) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', username);
        localStorage.setItem('lastLogin', new Date().toISOString());
        localStorage.setItem('rememberedUsername', username);

        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
    } else {
        alert('用戶名稱或密碼錯誤！');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (password !== confirm) {
        alert('兩次密碼不一致');
        return;
    }

    let users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    if (users.find(u => u.username === username)) {
        alert('此用戶名稱已被註冊');
        return;
    }

    users.push({ username, password });
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    alert('註冊成功！請登入');
    showLoginForm();
}

// ==================== 密碼顯示/隱藏 ====================
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ==================== 帳戶切換 ====================
function switchAccount(accountId) {
    currentAccountId = accountId;
    saveAccounts();
    updateBalance();
    updateDailyLimitUI();
    document.getElementById('accountSwitcher').classList.add('hidden');
}

function toggleAccountSwitcher() {
    const switcher = document.getElementById('accountSwitcher');
    switcher.classList.toggle('hidden');
    if (!switcher.classList.contains('hidden')) renderAccountList();
}

function renderAccountList() {
    const container = document.getElementById('accountSwitcher');
    container.innerHTML = '';
    accounts.forEach(acc => {
        const div = document.createElement('div');
        div.className = `px-4 py-3 flex justify-between hover:bg-zinc-50 cursor-pointer ${acc.id === currentAccountId ? 'bg-blue-50' : ''}`;
        div.innerHTML = `
            <div>
                <div class="font-medium">${acc.name}</div>
                <div class="text-xs text-zinc-400 font-mono">${acc.accountNumber}</div>
            </div>
            <div class="font-semibold">HK$ ${acc.balance.toLocaleString()}</div>
        `;
        div.onclick = () => switchAccount(acc.id);
        container.appendChild(div);
    });
}

// ==================== 轉帳處理 ====================
function processTransfer() {
    hideConfirmModal();

    const account = getCurrentAccount();
    if (!account) return;

    const amount = currentTransferData.amount;

    if (amount > account.balance) {
        alert('餘額不足！');
        return;
    }

    const transferredToday = getTodayTransferredAmount();
    if (transferredToday + amount > DAILY_LIMIT) {
        alert('已超過今日轉帳限額！');
        return;
    }

    setTimeout(() => {
        account.balance -= amount;
        addToDailyTransfer(amount);

        const now = new Date();
        const txnId = 'TXN' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');

        const newTxn = {
            id: txnId,
            date: now.toLocaleString('zh-HK'),
            amount: amount,
            to: currentTransferData.name,
            account: currentTransferData.account,
            note: currentTransferData.note || '',
            type: 'out'
        };

        transactions.unshift(newTxn);
        saveData();
        saveAccounts();

        updateBalance();
        updateDailyLimitUI();
        renderHistory();
        showSuccessModal(newTxn);
    }, 1200);
}

// ==================== 交易記錄 ====================
function renderHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;
    container.innerHTML = '';
    
    if (transactions.length === 0) {
        container.innerHTML = `<div class="py-10 text-center text-zinc-400 text-sm">暫無交易記錄</div>`;
        return;
    }
    
    transactions.forEach(tx => {
        const row = document.createElement('div');
        row.className = `transaction-row px-5 py-4 flex justify-between items-center border-b last:border-b-0`;
        row.innerHTML = `
            <div class="flex-1">
                <div class="font-medium">${tx.to}</div>
                <div class="text-xs text-zinc-400 font-mono">${tx.account} • ${tx.date}</div>
                ${tx.note ? `<div class="text-xs text-zinc-500 mt-1">${tx.note}</div>` : ''}
            </div>
            <div class="text-right">
                <div class="font-semibold text-red-600">- HK$ ${formatCurrency(tx.amount)}</div>
                <div class="text-[10px] text-zinc-400 font-mono">${tx.id}</div>
            </div>
        `;
        container.appendChild(row);
    });
}

function exportToCSV() {
    if (transactions.length === 0) {
        alert('目前沒有交易記錄可以匯出');
        return;
    }
    
    let csv = '\ufeff交易編號,日期,收款人,帳號,金額,備註\n';
    transactions.forEach(tx => {
        csv += `${tx.id},${tx.date},${tx.to},${tx.account},${tx.amount},"${tx.note || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `交易記錄_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

// ==================== 登出 ====================
function logout() {
    if (confirm('確定要登出嗎？')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        location.reload();
    }
}

// ==================== 初始化 ====================
function init() {
    loadData();
    loadAccounts();

    const savedLimit = localStorage.getItem('dailyLimit');
    if (savedLimit) DAILY_LIMIT = parseInt(savedLimit);

    checkLoginStatus();
    updateBalance();
    updateDailyLimitUI();
    renderFavorites();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    const transferForm = document.getElementById('transferForm');
    if (transferForm) {
        transferForm.addEventListener('submit', function(e) {
            e.preventDefault();
            currentTransferData = {
                name: document.getElementById('recipientName').value,
                account: document.getElementById('recipientAccount').value,
                amount: parseFloat(document.getElementById('amount').value),
                note: document.getElementById('note').value
            };
            showConfirmModal();
        });
    }

    console.log('%cDemoBank 已載入成功', 'color:#10b981');
}

document.addEventListener('DOMContentLoaded', init);

// 暴露全局函數
window.quickAmount = quickAmount;
window.switchTab = switchTab;
window.showAccountModal = () => alert('帳戶詳情 (Demo)');
window.togglePassword = togglePassword;
window.logout = logout;
window.toggleAccountSwitcher = toggleAccountSwitcher;
window.updateDailyLimit = () => {
    const input = document.getElementById('dailyLimitInput');
    if (input) {
        DAILY_LIMIT = parseInt(input.value) || 100000;
        localStorage.setItem('dailyLimit', DAILY_LIMIT);
        updateDailyLimitUI();
        alert('每日限額已更新');
    }
};

// Modal 控制
function showConfirmModal() {
    document.getElementById('confirmName').textContent = currentTransferData.name;
    document.getElementById('confirmAccount').textContent = currentTransferData.account;
    document.getElementById('confirmAmount').textContent = `HK$ ${formatCurrency(currentTransferData.amount)}`;

    document.getElementById('confirmModal').classList.remove('hidden');
    document.getElementById('confirmModal').classList.add('flex');
}

function hideConfirmModal() {
    document.getElementById('confirmModal').classList.remove('flex');
    document.getElementById('confirmModal').classList.add('hidden');
}

function showSuccessModal(txn) {
    document.getElementById('successModal').classList.remove('hidden');
    document.getElementById('successModal').classList.add('flex');
}

function completeTransfer() {
    document.getElementById('successModal').classList.remove('flex');
    document.getElementById('successModal').classList.add('hidden');
    document.getElementById('transferForm').reset();
    switchTab(2); // 跳到交易記錄頁
}
