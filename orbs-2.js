delete window.$;
(() => {
	let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
	webpackChunkdiscord_app.pop();

	const modules = Object.values(wpRequire.c);
	const getCandidate = (pred) => modules.find(pred);
	const getExport = (obj, path) => path.split('.').reduce((acc, key) => acc?.[key], obj);

	const findStore = (storeName) => {
		for (const m of modules) {
			try {
				const exp = m?.exports;
				if (!exp || typeof exp !== 'object') continue;
				for (const key of Object.keys(exp)) {
					const prop = exp[key];
					if (prop && typeof prop === 'object'
						&& prop.__proto__?.constructor?.displayName === storeName) {
						return prop;
					}
				}
			} catch {}
		}
		return null;
	};

	const findDispatcher = () => {
		for (const m of modules) {
			try {
				const exp = m?.exports;
				if (!exp || typeof exp !== 'object') continue;
				for (const key of Object.keys(exp)) {
					const prop = exp[key];
					if (prop && prop._subscriptions
						&& typeof prop.subscribe === 'function'
						&& typeof prop.dispatch === 'function'
						&& typeof prop.__proto__?.flushWaitQueue === 'function') {
						return prop;
					}
				}
			} catch {}
		}
		return null;
	};

	const findAPI = () => {
		for (const m of modules) {
			try {
				const exp = m?.exports;
				if (!exp || typeof exp !== 'object') continue;
				for (const key of Object.keys(exp)) {
					const prop = exp[key];
					if (prop && typeof prop.get === 'function'
						&& typeof prop.post === 'function'
						&& typeof prop.del === 'function'
						&& !prop._dispatcher) {
						return prop;
					}
				}
			} catch {}
		}
		return null;
	};

	let ApplicationStreamingStore = findStore('ApplicationStreamingStore');
	let RunningGameStore = findStore('RunningGameStore');
	let QuestsStore = findStore('QuestStore') || findStore('QuestsStore');
	let ChannelStore = findStore('ChannelStore');
	let GuildChannelStore = findStore('GuildChannelStore');
	let FluxDispatcher = findDispatcher();
	let api = findAPI();

	if (!ApplicationStreamingStore) {
		ApplicationStreamingStore = getExport(getCandidate(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata), 'exports.Z')
			|| getExport(getCandidate(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata), 'exports.A');
	}
	if (!RunningGameStore) {
		RunningGameStore = getExport(getCandidate(x => x?.exports?.ZP?.getRunningGames), 'exports.ZP')
			|| getExport(getCandidate(x => x?.exports?.Ay?.getRunningGames), 'exports.Ay');
	}
	if (!QuestsStore) {
		QuestsStore = getExport(getCandidate(x => x?.exports?.Z?.__proto__?.getQuest), 'exports.Z')
			|| getExport(getCandidate(x => x?.exports?.A?.__proto__?.getQuest), 'exports.A');
	}
	if (!ChannelStore) {
		ChannelStore = getExport(getCandidate(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent), 'exports.Z')
			|| getExport(getCandidate(x => x?.exports?.A?.__proto__?.getAllThreadsForParent), 'exports.A');
	}
	if (!GuildChannelStore) {
		GuildChannelStore = getExport(getCandidate(x => x?.exports?.ZP?.getSFWDefaultChannel), 'exports.ZP')
			|| getExport(getCandidate(x => x?.exports?.Ay?.getSFWDefaultChannel), 'exports.Ay');
	}
	if (!FluxDispatcher) {
		FluxDispatcher = getExport(getCandidate(x => x?.exports?.Z?.__proto__?.flushWaitQueue), 'exports.Z')
			|| getExport(getCandidate(x => x?.exports?.h?.__proto__?.flushWaitQueue), 'exports.h');
	}
	if (!api) {
		api = getExport(getCandidate(x => x?.exports?.tn?.get), 'exports.tn')
			|| getExport(getCandidate(x => x?.exports?.Bo?.get), 'exports.Bo');
	}

	console.log('module resolution', {
		ApplicationStreamingStore: !!ApplicationStreamingStore,
		RunningGameStore: !!RunningGameStore,
		QuestsStore: !!QuestsStore,
		ChannelStore: !!ChannelStore,
		GuildChannelStore: !!GuildChannelStore,
		FluxDispatcher: !!FluxDispatcher,
		api: !!api
	});

	if (!ApplicationStreamingStore || !RunningGameStore || !QuestsStore || !ChannelStore || !GuildChannelStore || !FluxDispatcher || !api) {
		console.error("Failed to find all required Discord modules!");
		console.log({
			ApplicationStreamingStore: !!ApplicationStreamingStore,
			RunningGameStore: !!RunningGameStore,
			QuestsStore: !!QuestsStore,
			ChannelStore: !!ChannelStore,
			GuildChannelStore: !!GuildChannelStore,
			FluxDispatcher: !!FluxDispatcher,
			api: !!api
		});
		throw new Error("Discord modules could not be resolved.");
	}

	let quest = [...QuestsStore.quests.values()].find(x => x.id !== "1412491570820812933" && x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now())
	let isApp = typeof DiscordNative !== "undefined"
	if(!quest) {
		console.log("You don't have any uncompleted quests!")
	} else {
		const pid = Math.floor(Math.random() * 30000) + 1000
		
		const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2
		const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"].find(x => taskConfig.tasks[x] != null)
		// v1: quest.config.application.id | v2: taskConfig.tasks[taskName].applications[0].id
		const v2App = taskConfig.tasks[taskName]?.applications?.[0]
		const applicationId = quest.config.application?.id ?? v2App?.id
		const applicationName = quest.config.application?.name ?? v2App?.name ?? quest.config.messages.questName
		const questName = quest.config.messages.questName
		const secondsNeeded = taskConfig.tasks[taskName].target
		let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0

		if(taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
			const maxFuture = 10, speed = 7, interval = 1
			const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime()
			let completed = false
			let fn = async () => {			
				while(true) {
					const maxAllowed = Math.floor((Date.now() - enrolledAt)/1000) + maxFuture
					const diff = maxAllowed - secondsDone
					const timestamp = secondsDone + speed
					if(diff >= speed) {
						const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}})
						completed = res.body.completed_at != null
						secondsDone = Math.min(secondsNeeded, timestamp)
					}
					
					if(timestamp >= secondsNeeded) {
						break
					}
					await new Promise(resolve => setTimeout(resolve, interval * 1000))
				}
				if(!completed) {
					await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}})
				}
				console.log("Quest completed!")
			}
			fn()
			console.log(`Spoofing video for ${questName}.`)
		} else if(taskName === "PLAY_ON_DESKTOP") {
			if(!isApp) {
				console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!")
			} else {
api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => {
				const appData = res.body[0]
				const exeName = appData.executables?.find(x => x.os === "win32")?.name.replace(">", "") || `${appData.name}.exe`
					
					const fakeGame = {
						cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
						exeName,
						exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
						hidden: false,
						isLauncher: false,
						id: applicationId,
						name: appData.name,
						pid: pid,
						pidPath: [pid],
						processName: appData.name,
						start: Date.now(),
					}
					const realGames = RunningGameStore.getRunningGames()
					const fakeGames = [fakeGame]
					const realGetRunningGames = RunningGameStore.getRunningGames
					const realGetGameForPID = RunningGameStore.getGameForPID
					RunningGameStore.getRunningGames = () => fakeGames
					RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid)
					FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames})
					
					let fn = data => {
						let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value)
						console.log(`Quest progress: ${progress}/${secondsNeeded}`)
						
						if(progress >= secondsNeeded) {
							console.log("Quest completed!")
							
							RunningGameStore.getRunningGames = realGetRunningGames
							RunningGameStore.getGameForPID = realGetGameForPID
							FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []})
							FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
						}
					}
					FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
					console.log(`Spoofed your game to ${applicationName}. Wait for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`)
				}).catch(err => {
					console.error("Failed to fetch application data:", err)
				})
			}
		} else if(taskName === "STREAM_ON_DESKTOP") {
			if(!isApp) {
				console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!")
			} else {
				let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata
				ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
					id: applicationId,
					pid,
					sourceName: null
				})
				
				let fn = data => {
					let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value)
					console.log(`Quest progress: ${progress}/${secondsNeeded}`)
					
					if(progress >= secondsNeeded) {
						console.log("Quest completed!")
						
						ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc
						FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
					}
				}
				FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
				
				console.log(`Spoofed your stream to ${applicationName}. Stream any window in vc for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`)
				console.log("Remember that you need at least 1 other person to be in the vc!")
			}
		} else if(taskName === "PLAY_ACTIVITY") {
			const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id
			const streamKey = `call:${channelId}:1`
			
			let fn = async () => {
				console.log("Completing quest", questName, "-", quest.config.messages.questName)
				
				while(true) {
					const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}})
					const progress = res.body.progress.PLAY_ACTIVITY.value
					console.log(`Quest progress: ${progress}/${secondsNeeded}`)
					
					await new Promise(resolve => setTimeout(resolve, 20 * 1000))
					
					if(progress >= secondsNeeded) {
						await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}})
						break
					}
				}
				
				console.log("Quest completed!")
			}
			fn()
		}
	}
})();