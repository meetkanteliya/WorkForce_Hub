def get_dsa_section():
    return '''
<div class="container section" id="dsa">
<div class="section-header">
<h2>11 — Coding Round (30+ DSA Problems)</h2>
<p>Arrays, strings, hashmaps, recursion, and trees — with approach and solutions.</p>
</div>

<h3>Arrays</h3>

<h4><span class="badge easy">Easy</span> 1. Two Sum</h4>
<pre>
# Given array and target, find two indices that sum to target
def two_sum(nums, target):
    seen = {}  # value → index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
# Time: O(n), Space: O(n)
# Approach: Use hashmap to store seen values, check if complement exists
</pre>

<h4><span class="badge easy">Easy</span> 2. Best Time to Buy and Sell Stock</h4>
<pre>
def max_profit(prices):
    min_price = float('inf')
    max_profit = 0
    for price in prices:
        min_price = min(min_price, price)
        max_profit = max(max_profit, price - min_price)
    return max_profit
# Time: O(n), Space: O(1)
# Approach: Track minimum price so far, calculate profit at each step
</pre>

<h4><span class="badge easy">Easy</span> 3. Contains Duplicate</h4>
<pre>
def contains_duplicate(nums):
    return len(nums) != len(set(nums))
# Time: O(n), Space: O(n)
</pre>

<h4><span class="badge medium">Medium</span> 4. Product of Array Except Self</h4>
<pre>
def product_except_self(nums):
    n = len(nums)
    result = [1] * n
    # Left pass: result[i] = product of all elements to the left
    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= nums[i]
    # Right pass: multiply by product of all elements to the right
    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]
    return result
# Time: O(n), Space: O(1) excluding output
# Approach: Use prefix and suffix products without division
</pre>

<h4><span class="badge medium">Medium</span> 5. Maximum Subarray (Kadane's Algorithm)</h4>
<pre>
def max_subarray(nums):
    current_sum = max_sum = nums[0]
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    return max_sum
# Time: O(n), Space: O(1)
# Approach: At each element, decide: start new subarray or extend current
</pre>

<h4><span class="badge medium">Medium</span> 6. Merge Intervals</h4>
<pre>
def merge_intervals(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged
# Time: O(n log n), Space: O(n)
# Input: [[1,3],[2,6],[8,10],[15,18]] → Output: [[1,6],[8,10],[15,18]]
</pre>

<h4><span class="badge hard">Hard</span> 7. Trapping Rain Water</h4>
<pre>
def trap(height):
    left, right = 0, len(height) - 1
    left_max = right_max = water = 0
    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                water += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                water += right_max - height[right]
            right -= 1
    return water
# Time: O(n), Space: O(1)
# Approach: Two pointers from both ends, track max height on each side
</pre>

<h3>Strings</h3>

<h4><span class="badge easy">Easy</span> 8. Valid Anagram</h4>
<pre>
from collections import Counter
def is_anagram(s, t):
    return Counter(s) == Counter(t)
# Time: O(n), Space: O(1) — at most 26 chars
</pre>

<h4><span class="badge easy">Easy</span> 9. Valid Palindrome</h4>
<pre>
def is_palindrome(s):
    cleaned = ''.join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]
# Time: O(n), Space: O(n)
</pre>

<h4><span class="badge medium">Medium</span> 10. Longest Substring Without Repeating Characters</h4>
<pre>
def length_of_longest_substring(s):
    char_index = {}
    max_len = start = 0
    for i, char in enumerate(s):
        if char in char_index and char_index[char] >= start:
            start = char_index[char] + 1
        char_index[char] = i
        max_len = max(max_len, i - start + 1)
    return max_len
# Time: O(n), Space: O(min(n, 26))
# Approach: Sliding window with hashmap tracking last index of each char
</pre>

<h4><span class="badge medium">Medium</span> 11. Group Anagrams</h4>
<pre>
from collections import defaultdict
def group_anagrams(strs):
    groups = defaultdict(list)
    for s in strs:
        key = tuple(sorted(s))
        groups[key].append(s)
    return list(groups.values())
# Time: O(n * k log k), Space: O(n * k)
</pre>

<h4><span class="badge hard">Hard</span> 12. Minimum Window Substring</h4>
<pre>
from collections import Counter
def min_window(s, t):
    need = Counter(t)
    missing = len(t)
    left = start = end = 0
    for right, char in enumerate(s, 1):
        if need[char] > 0:
            missing -= 1
        need[char] -= 1
        if missing == 0:  # all chars found
            while need[s[left]] < 0:
                need[s[left]] += 1
                left += 1
            if not end or right - left <= end - start:
                start, end = left, right
            need[s[left]] += 1
            missing += 1
            left += 1
    return s[start:end]
# Time: O(n), Space: O(k)
</pre>

<h3>Hashmap</h3>

<h4><span class="badge easy">Easy</span> 13. First Non-Repeating Character</h4>
<pre>
from collections import Counter
def first_unique(s):
    count = Counter(s)
    for i, c in enumerate(s):
        if count[c] == 1:
            return i
    return -1
</pre>

<h4><span class="badge medium">Medium</span> 14. Top K Frequent Elements</h4>
<pre>
from collections import Counter
def top_k_frequent(nums, k):
    return [x for x, _ in Counter(nums).most_common(k)]
# Time: O(n log k) with heap, O(n) with bucket sort
</pre>

<h4><span class="badge medium">Medium</span> 15. Subarray Sum Equals K</h4>
<pre>
from collections import defaultdict
def subarray_sum(nums, k):
    count = 0
    prefix_sum = 0
    prefix_counts = defaultdict(int)
    prefix_counts[0] = 1
    for num in nums:
        prefix_sum += num
        count += prefix_counts[prefix_sum - k]
        prefix_counts[prefix_sum] += 1
    return count
# Time: O(n), Space: O(n)
# Approach: prefix sum + hashmap
</pre>

<h3>Recursion / Backtracking</h3>

<h4><span class="badge easy">Easy</span> 16. Fibonacci (with memoization)</h4>
<pre>
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)
# Time: O(n) with memo, O(2^n) without
</pre>

<h4><span class="badge medium">Medium</span> 17. Generate Parentheses</h4>
<pre>
def generate_parenthesis(n):
    result = []
    def backtrack(current, open_count, close_count):
        if len(current) == 2 * n:
            result.append(current)
            return
        if open_count < n:
            backtrack(current + "(", open_count + 1, close_count)
        if close_count < open_count:
            backtrack(current + ")", open_count, close_count + 1)
    backtrack("", 0, 0)
    return result
</pre>

<h4><span class="badge medium">Medium</span> 18. Permutations</h4>
<pre>
def permutations(nums):
    result = []
    def backtrack(path, remaining):
        if not remaining:
            result.append(path[:])
            return
        for i in range(len(remaining)):
            path.append(remaining[i])
            backtrack(path, remaining[:i] + remaining[i+1:])
            path.pop()
    backtrack([], nums)
    return result
</pre>

<h4><span class="badge medium">Medium</span> 19. Combination Sum</h4>
<pre>
def combination_sum(candidates, target):
    result = []
    def backtrack(start, current, remaining):
        if remaining == 0:
            result.append(current[:])
            return
        if remaining < 0:
            return
        for i in range(start, len(candidates)):
            current.append(candidates[i])
            backtrack(i, current, remaining - candidates[i])
            current.pop()
    backtrack(0, [], target)
    return result
</pre>

<h3>Trees</h3>

<h4><span class="badge easy">Easy</span> 20. Max Depth of Binary Tree</h4>
<pre>
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def max_depth(root):
    if not root: return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
</pre>

<h4><span class="badge easy">Easy</span> 21. Invert Binary Tree</h4>
<pre>
def invert_tree(root):
    if not root: return None
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
</pre>

<h4><span class="badge easy">Easy</span> 22. Same Tree</h4>
<pre>
def is_same_tree(p, q):
    if not p and not q: return True
    if not p or not q: return False
    return (p.val == q.val and
            is_same_tree(p.left, q.left) and
            is_same_tree(p.right, q.right))
</pre>

<h4><span class="badge medium">Medium</span> 23. Level Order Traversal (BFS)</h4>
<pre>
from collections import deque
def level_order(root):
    if not root: return []
    result = []
    queue = deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result
</pre>

<h4><span class="badge medium">Medium</span> 24. Validate BST</h4>
<pre>
def is_valid_bst(root, min_val=float(\'-inf\'), max_val=float(\'inf\')):
    if not root: return True
    if root.val <= min_val or root.val >= max_val:
        return False
    return (is_valid_bst(root.left, min_val, root.val) and
            is_valid_bst(root.right, root.val, max_val))
</pre>

<h3>Linked List</h3>

<h4><span class="badge easy">Easy</span> 25. Reverse Linked List</h4>
<pre>
def reverse_list(head):
    prev = None
    while head:
        next_node = head.next
        head.next = prev
        prev = head
        head = next_node
    return prev
# Time: O(n), Space: O(1)
</pre>

<h4><span class="badge easy">Easy</span> 26. Detect Cycle (Floyd\'s)</h4>
<pre>
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast: return True
    return False
</pre>

<h4><span class="badge medium">Medium</span> 27. Merge Two Sorted Lists</h4>
<pre>
def merge_lists(l1, l2):
    dummy = ListNode(0)
    current = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            current.next = l1
            l1 = l1.next
        else:
            current.next = l2
            l2 = l2.next
        current = current.next
    current.next = l1 or l2
    return dummy.next
</pre>

<h3>Stack / Queue</h3>

<h4><span class="badge easy">Easy</span> 28. Valid Parentheses</h4>
<pre>
def is_valid(s):
    stack = []
    mapping = {\')\': \'(\', \'}\': \'{\', \']\': \'[\'}
    for char in s:
        if char in mapping:
            if not stack or stack[-1] != mapping[char]:
                return False
            stack.pop()
        else:
            stack.append(char)
    return len(stack) == 0
</pre>

<h4><span class="badge medium">Medium</span> 29. Min Stack</h4>
<pre>
class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []  # track minimums
    
    def push(self, val):
        self.stack.append(val)
        if not self.min_stack or val <= self.min_stack[-1]:
            self.min_stack.append(val)
    
    def pop(self):
        val = self.stack.pop()
        if val == self.min_stack[-1]:
            self.min_stack.pop()
    
    def get_min(self):
        return self.min_stack[-1]
# All operations O(1)
</pre>

<h4><span class="badge medium">Medium</span> 30. Daily Temperatures</h4>
<pre>
def daily_temperatures(temps):
    result = [0] * len(temps)
    stack = []  # indices of temps waiting for warmer day
    for i, temp in enumerate(temps):
        while stack and temp > temps[stack[-1]]:
            idx = stack.pop()
            result[idx] = i - idx
        stack.append(i)
    return result
# Time: O(n), Space: O(n)
# Approach: Monotonic decreasing stack
</pre>

<h4><span class="badge medium">Medium</span> 31. Binary Search</h4>
<pre>
def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target: return mid
        elif nums[mid] < target: left = mid + 1
        else: right = mid - 1
    return -1
# Time: O(log n), Space: O(1)
</pre>

<h4><span class="badge medium">Medium</span> 32. Search in Rotated Sorted Array</h4>
<pre>
def search_rotated(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target: return mid
        if nums[left] <= nums[mid]:  # left half sorted
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:  # right half sorted
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1
</pre>

<div class="card tip">
<h4>💡 DSA Interview Tips</h4>
<ul>
<li>Always clarify input constraints and edge cases before coding</li>
<li>State your approach and time/space complexity BEFORE writing code</li>
<li>Start with brute force, then optimize</li>
<li>Think aloud — interviewers want to see your thought process</li>
<li>Test with examples: empty input, single element, duplicates</li>
<li>Know these patterns: Two Pointers, Sliding Window, HashMap, BFS/DFS, Binary Search, Backtracking, Monotonic Stack</li>
</ul>
</div>

</div>
'''
