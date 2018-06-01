.PHONY: all server clean node_modules/ hotel.add 
NODE_BIN=./node_modules/.bin

all: server

server: node_modules/
	PORT=5052 node server/index.js

node_modules/: package.json
	npm install
	touch node_modules/

clean:
	-rm -f package-lock.json
	-rm -r ./node_modules
	-npm cache verify

hotel.add: node_modules/
	hotel add 'make server' --port 5052 --out app.log
