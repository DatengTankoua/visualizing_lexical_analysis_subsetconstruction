# @NAME EpsilonNFA
# @REGEX a+

states q0 q1 q2
start q0
accept q2
alphabet a

q0 ε q1
q1 a q1
q1 a q2