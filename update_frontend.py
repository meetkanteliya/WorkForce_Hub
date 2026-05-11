import re

with open("frontend/src/pages/leaves/LeaveRequestList.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Imports
code = code.replace(
    "selectBalanceLoading,",
    "selectBalanceLoading,\n    selectRequestsCount,\n    selectBalancesCount,"
)

# 2. Selectors in component
selectors = """    const balances = useSelector(selectBalances);
    const balancesCount = useSelector(selectBalancesCount);
    const balanceLoading = useSelector(selectBalanceLoading);
    const requestsCount = useSelector(selectRequestsCount);
    const departments = useSelector(selectDepartmentList);"""

code = re.sub(
    r'    const balances = useSelector\(selectBalances\);\n    const balanceLoading = useSelector\(selectBalanceLoading\);\n    const departments = useSelector\(selectDepartmentList\);',
    selectors,
    code
)

# 3. useEffect
old_use_effect = """    // ─── Fetch data via Redux ───
    useEffect(() => {
        if (tab === 'balances') {
            dispatch(fetchBalancesThunk());
        } else {
            dispatch(fetchLeaveRequests({ tab }));
        }
    }, [tab, dispatch]);"""

new_use_effect = """    // ─── Fetch data via Redux ───
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

code = code.replace(old_use_effect, new_use_effect)

# 4. handleAction
old_handle_action = """    const handleAction = async (id, action) => {
        try {
            await dispatch(actionLeaveRequest({ id, action })).unwrap();
        } catch (err) {"""

new_handle_action = """    const handleAction = async (id, action) => {
        try {
            await dispatch(actionLeaveRequest({ id, action })).unwrap();
            dispatch(fetchLeaveRequests({ tab, page: currentPage, status: statusFilter, department: departmentFilter, search: searchQuery }));
            dispatch(fetchBalancesThunk({ page: 1, department: 'All', search: '' }));
        } catch (err) {"""

code = code.replace(old_handle_action, new_handle_action)

# 5. handleAdjust
old_adjust = """            const res = await dispatch(adjustBalance({ balanceId: balance.id, payload })).unwrap();

            // If the modal is open, update the selectedEmployeeBalances state
            if (selectedEmployeeBalances) {"""

new_adjust = """            const res = await dispatch(adjustBalance({ balanceId: balance.id, payload })).unwrap();
            
            dispatch(fetchBalancesThunk({ page: currentPage, department: departmentFilter, search: balanceSearch }));

            // If the modal is open, update the selectedEmployeeBalances state
            if (selectedEmployeeBalances) {"""

code = code.replace(old_adjust, new_adjust)

# 6. Remove client-side filtering & local pagination
filtering_regex = r"    // ─── Filtered requests ───.*?(?=\s*return \(\n)"

new_filtering = """    // Group the balances by employee for the main table
    const groupedBalances = {};
    balances.forEach(b => {
        const key = b.employee_id || b.employee_code || b.employee_name;
        if (!groupedBalances[key]) {
            groupedBalances[key] = {
                employee_id: key,
                employee_name: b.employee_name,
                employee_code: b.employee_code,
                employee_profile_picture: b.employee_profile_picture,
                department_name: b.department_name,
                total_allocated: 0,
                total_used: 0,
                total_remaining: 0,
                records: []
            };
        }
        const existingRecordIndex = groupedBalances[key].records.findIndex(
            r => r.leave_type?.id === b.leave_type?.id
        );

        if (existingRecordIndex === -1) {
            groupedBalances[key].total_allocated += parseFloat(b.allocated_days) || 0;
            groupedBalances[key].total_used += parseFloat(b.used_days) || 0;
            groupedBalances[key].total_remaining += parseFloat(b.remaining_days) || 0;
            groupedBalances[key].records.push(b);
        } else {
            if (b.id > groupedBalances[key].records[existingRecordIndex].id) {
                const oldRec = groupedBalances[key].records[existingRecordIndex];
                groupedBalances[key].total_allocated -= parseFloat(oldRec.allocated_days) || 0;
                groupedBalances[key].total_used -= parseFloat(oldRec.used_days) || 0;
                groupedBalances[key].total_remaining -= parseFloat(oldRec.remaining_days) || 0;

                groupedBalances[key].total_allocated += parseFloat(b.allocated_days) || 0;
                groupedBalances[key].total_used += parseFloat(b.used_days) || 0;
                groupedBalances[key].total_remaining += parseFloat(b.remaining_days) || 0;

                groupedBalances[key].records[existingRecordIndex] = b;
            }
        }
    });

    const aggregatedBalancesArray = Object.values(groupedBalances).sort((a, b) => a.employee_name.localeCompare(b.employee_name));

    const requestsTotalPages = Math.ceil(requestsCount / itemsPerPage) || 1;
    const balancesTotalPages = Math.ceil(balancesCount / itemsPerPage) || 1;
    const requestsStartIndex = (currentPage - 1) * itemsPerPage;
    const balancesStartIndex = (currentPage - 1) * itemsPerPage;
"""

code = re.sub(filtering_regex, new_filtering, code, flags=re.DOTALL)

# 7. Replace usage of currentRequests / currentBalances
code = code.replace("currentRequests.map((req)", "requests.map((req)")
code = code.replace("currentBalances.map((group)", "aggregatedBalancesArray.map((group)")
code = code.replace("filteredRequests.length === 0", "requests.length === 0")

code = code.replace("totalItems={totalBalances}", "totalItems={balancesCount}")
code = code.replace("totalItems={totalRequests}", "totalItems={requestsCount}")

with open("frontend/src/pages/leaves/LeaveRequestList.jsx", "w", encoding="utf-8") as f:
    f.write(code)
