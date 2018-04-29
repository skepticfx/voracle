# voracle
#### Compression oracle attacks on VPN networks

### Usage
```
# install nodejs requirements
cd voracle
npm install

# install python requirments
cd voracle/attack
pip install -r requirements.txt

# start vpn client
# tested with openvpn client 3
# https://github.com/OpenVPN/openvpn3

# start MITM
cd voracle/attack
python mimt.py

# start attack server on localhost:9999
# modify config.json to your requirements
cd voracle
npm start
```

### Sample Demo
<img src="https://test.skepticfx.com/demos/91283u89232903230/voracle-test.skepticfx.com.gif" />

### Abstract
Security researchers have done a good amount of practical attacks in the past using chosen plain-text attacks on compressed traffic to steal sensitive data. 
In spite of how popular CRIME and BREACH were, little was talked about how this class of attacks was relevant to VPN networks. 
Compression oracle attacks are not limited to TLS protected data. Regardless of the underlying encryption framework being used, 
these VPN networks offer a very well used feature usually known as TCP Compression which in a way acts almost similar to the 
TLS compression feature pre-CRIME era. 

In this paper, we try these attacks on browser requests and responses which usually tunnel their HTTP traffic through VPNs. 
We also explore the possibility of attacking ESP Compression and other such optimizations in any tunneled traffic which does encryption. 
We also show a case study with a well-known VPN server and their plethora of clients. 

We then go into practical defenses and how mitigations in HTTP/2's HPACK and other mitigation techniques are the way forward 
rather than claiming 'Thou shall not compress traffic at all'. 
One of the things that we would like to showcase is how impedance mismatches in these different layers of technologies 
affect security and how they don't play well together.