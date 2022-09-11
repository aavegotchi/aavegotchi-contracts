-include .env

export FOUNDRY_ETH_RPC_URL=${MATIC_URL}
export FOUNDRY_FORK_BLOCK_NUMBER?=32983782


update-submodules: 
	@echo Update git submodules
	@git submodule update --init --recursive


test-events:
	@echo Running tests for wearable events 
	@forge test --mc PeripheryTest -vvvvv 
