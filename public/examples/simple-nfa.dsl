# @NAME SimpleNFA
# @REGEX a*b

states q0 q1 q2
start q0
accept q2
alphabet a b

q0 a q0
q0 b q1
q1 b q2