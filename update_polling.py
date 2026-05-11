import re

with open("frontend/src/pages/leaves/LeaveRequestList.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update useEffect for AbortController and Polling
old_use_effect = """    // ─── Fetch data via Redux ───
    useEffect(() => {
        const timer = setTimeout(() => {
            if (tab === 'balances') {
                dispatch(fetchBalancesThunk({ page: currentPage, department: departmentFilter, search: balanceSearch }));
            } else {
                dispatch(fetchLeaveRequests({ tab, page: currentPage, status: statusFilter, department: departmentFilter, search: searchQuery }));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [tab, currentPage, statusFilter, departmentFilter, searchQuery, balanceSearch, dispatch]);"""

new_use_effect = """    // ─── Fetch data via Redux ───
    useEffect(() => {
        let currentPromise;
        
        const fetchData = () => {
            if (tab === 'balances') {
                currentPromise = dispatch(fetchBalancesThunk({ page: currentPage, department: departmentFilter, search: balanceSearch }));
            } else {
                currentPromise = dispatch(fetchLeaveRequests({ tab, page: currentPage, status: statusFilter, department: departmentFilter, search: searchQuery }));
            }
        };

        // Debounce primary fetch
        const timer = setTimeout(() => {
            fetchData();
        }, 300);

        // Polling for multi-admin sync every 15 seconds
        const pollInterval = setInterval(() => {
            fetchData();
        }, 15000);

        return () => {
            clearTimeout(timer);
            clearInterval(pollInterval);
            if (currentPromise) {
                currentPromise.abort();
            }
        };
    }, [tab, currentPage, statusFilter, departmentFilter, searchQuery, balanceSearch, dispatch]);"""

code = code.replace(old_use_effect, new_use_effect)

with open("frontend/src/pages/leaves/LeaveRequestList.jsx", "w", encoding="utf-8") as f:
    f.write(code)
