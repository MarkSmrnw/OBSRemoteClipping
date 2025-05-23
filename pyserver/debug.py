import client
import jsonserver

import threading


t1 = threading.Thread(target=client.run)
t2 = threading.Thread(target=jsonserver.run)
t1.start()
t2.start()