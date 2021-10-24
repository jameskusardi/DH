export const Abilities: {[k: string]: ModdedAbilityData} = {
	//Set 1
	porous: {//Feel like this might be wrong
		id: "porous",
		name: "Porous",
		shortDesc: "Ignores foe's stat stages; restores 1/4 max HP if hit by Water; Water immunity.",
		onTryHit(target, source, move) {
			if (target !== source && (move.type === 'Water')) {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add('-immune', target, '[from] ability: Porous');
				}
				return null;
			}
			
		},
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectData.target;
			if (unawareUser === pokemon) return;
			if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
				boosts['evasion'] = 0;
			}
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts['atk'] = 0;
				boosts['def'] = 0;
				boosts['spa'] = 0;
				boosts['accuracy'] = 0;
			}
		},
	},
	despicable: {
		id: "despicable",
		name: "Despicable",
		shortDesc: "This Pokemon's attacks are critical hits if the target is burned or poisoned.",
		onModifyCritRatio(critRatio, source, target) {
			///////////PLACEHOLDER FOR STURDY MOLD
			let ignore = false;

				if (target.hasAbility('sturdymold')) {
					ignore = true;
					return;
				} 

			if (ignore) return;
			///////////END PLACEHOLDER
			if (target && ['psn', 'tox', 'brn'].includes(target.status)) return 5;
		},
	},
	kingsguard: {
		id: "kingsguard",
		name: "King's Guard",
		shortDesc: "Protected from enemy priority moves and Attack reduction.",
		onBoost(boost, target, source, effect) {
			if (source && target === source) return;
			if (boost.atk && boost.atk < 0) {
				delete boost.atk;
				if (!(effect as ActiveMove).secondaries) {
					this.add("-fail", target, "unboost", "Attack", "[from] ability: King's Guard", "[of] " + target);
				}
			}
		},
		onFoeTryMove(target, source, move) {
			const targetAllExceptions = ['perishsong', 'flowershield', 'rototiller'];
			if (move.target === 'foeSide' || (move.target === 'all' && !targetAllExceptions.includes(move.id))) {
				return;
			}

			const dazzlingHolder = this.effectData.target;
			if ((source.side === dazzlingHolder.side || move.target === 'all') && move.priority > 0.1) {
				this.attrLastMove('[still]');
				this.add('cant', dazzlingHolder, "ability: King's Guard", move, '[of] ' + target);
				return false;
			}
		},
	},
	growthveil: { //Too long
		id: "growthveil",
		name: "Growth Veil",
		shortDesc: "Restores 1/3 max HP on switch-out; ally Grass-types safe from enemy stat drops & status.",
		desc: "Restores 1/3 max HP on switch-out; ally Grass-types can't have stats lowered or status inflicted.",
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
		},
		onAllyBoost(boost, target, source, effect) {
			if ((source && target === source) || !target.hasType('Grass')) return;
			let showMsg = false;
			let i: BoostName;
			for (i in boost) {
				if (boost[i]! < 0) {
					delete boost[i];
					showMsg = true;
				}
			}
			if (showMsg && !(effect as ActiveMove).secondaries) {
				const effectHolder = this.effectData.target;
				this.add('-block', target, 'ability: Growth Veil', '[of] ' + effectHolder);
			}
		},
		onAllySetStatus(status, target, source, effect) {
			if (target.hasType('Grass') && source && target !== source && effect && effect.id !== 'yawn') {
				this.debug('interrupting setStatus with Growth Veil');
				if (effect.id === 'synchronize' || (effect.effectType === 'Move' && !effect.secondaries)) {
					const effectHolder = this.effectData.target;
					this.add('-block', target, 'ability: Growth Veil', '[of] ' + effectHolder);
				}
				return null;
			}
		},
		onAllyTryAddVolatile(status, target) {
			if (target.hasType('Grass') && status.id === 'yawn') {
				this.debug('Growth Veil blocking yawn');
				const effectHolder = this.effectData.target;
				this.add('-block', target, 'ability: Growth Veil', '[of] ' + effectHolder);
				return null;
			}
		},
	},
	surgeoneye: {
		id: "surgeoneye",
		name: "Surgeon Eye",
		shortDesc: "Restores 1/3 max HP on switch-out. Attack power 1.3x if it moves last in a turn.",
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, pokemon) {
			let boosted = true;
			for (const target of this.getAllActive()) {
				if (target === pokemon || target.hasAbility('sturdymold')) continue; //PLACEHOLDER
				if (this.queue.willMove(target)) {
					boosted = false;
					break;
				}
			}
			if (boosted) {
				this.debug('Surgeon Eye boost');
				return this.chainModify([0x14CD, 0x1000]);
			}
		},
	},
	//Set 2
	roughresult: { //Too long
		id: "roughresult",
		name: "Rough Result",
		shortDesc: "Foes making contact lose 1/8 max HP; if KOed by contact, attacker loses 1/4 max HP.",
		dsc: "Pokemon making contact lose 1/8 max HP; if KOed by a contact move, attacker loses 1/4 max HP.",
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (move.flags['contact']) {
				this.damage(source.baseMaxhp / 8, source, target);
			}
			if (move.flags['contact'] && !target.hp) {
				this.damage(source.baseMaxhp / 4, source, target);
			}
		},
	},
	eyeforaneye: {
		id: "eyeforaneye",
		name: "Eye for an Eye",
		shortDesc: "This Pokemon blocks Dark-type moves and bounces them back to the user.",
		onTryHitPriority: 1,
		onTryHit(target, source, move) {
			if (target === source || move.hasBounced || move.type !== 'Dark') {
				return;
			}
			const newMove = this.dex.getActiveMove(move.id);
			newMove.hasBounced = true;
			newMove.pranksterBoosted = false;
			this.useMove(newMove, target, source);
			return null;
		},
		onAllyTryHitSide(target, source, move) {
			if (target.side === source.side || move.hasBounced || move.type !== 'Dark') {
				return;
			}
			const newMove = this.dex.getActiveMove(move.id);
			newMove.hasBounced = true;
			newMove.pranksterBoosted = false;
			this.useMove(newMove, this.effectData.target, source);
			return null;
		},
		condition: {
			duration: 1,
		},
	},
	naturalheal: {
		id: "naturalheal",
		name: "Natural Heal",
		shortDesc: "Restores 1/3 max HP and cures non-volatile status on switch-out.",
		onCheckShow(pokemon) {
			// This is complicated
			// For the most part, in-game, it's obvious whether or not Natural Cure activated,
			// since you can see how many of your opponent's pokemon are statused.
			// The only ambiguous situation happens in Doubles/Triples, where multiple pokemon
			// that could have Natural Cure switch out, but only some of them get cured.
			if (pokemon.side.active.length === 1) return;
			if (pokemon.showCure === true || pokemon.showCure === false) return;

			const cureList = [];
			let noCureCount = 0;
			for (const curPoke of pokemon.side.active) {
				// pokemon not statused
				if (!curPoke || !curPoke.status) {
					// this.add('-message', "" + curPoke + " skipped: not statused or doesn't exist");
					continue;
				}
				if (curPoke.showCure) {
					// this.add('-message', "" + curPoke + " skipped: Natural Cure already known");
					continue;
				}
				const species = curPoke.species;
				// pokemon can't get Natural Cure
				if (!Object.values(species.abilities).includes('Natural Cure') && !Object.values(species.abilities).includes('Natural Heal')) {
					// this.add('-message', "" + curPoke + " skipped: no Natural Cure");
					continue;
				}
				// pokemon's ability is known to be Natural Cure
				if (!species.abilities['1'] && !species.abilities['H']) {
					// this.add('-message', "" + curPoke + " skipped: only one ability");
					continue;
				}
				// pokemon isn't switching this turn
				if (curPoke !== pokemon && !this.queue.willSwitch(curPoke)) {
					// this.add('-message', "" + curPoke + " skipped: not switching");
					continue;
				}

				if (curPoke.hasAbility('naturalcure') || curPoke.hasAbility('naturalheal')) {
					// this.add('-message', "" + curPoke + " confirmed: could be Natural Cure (and is)");
					cureList.push(curPoke);
				} else {
					// this.add('-message', "" + curPoke + " confirmed: could be Natural Cure (but isn't)");
					noCureCount++;
				}
			}

			if (!cureList.length || !noCureCount) {
				// It's possible to know what pokemon were cured
				for (const pkmn of cureList) {
					pkmn.showCure = true;
				}
			} else {
				// It's not possible to know what pokemon were cured

				// Unlike a -hint, this is real information that battlers need, so we use a -message
				this.add('-message', "(" + cureList.length + " of " + pokemon.side.name + "'s pokemon " + (cureList.length === 1 ? "was" : "were") + " cured by Natural Heal.)");

				for (const pkmn of cureList) {
					pkmn.showCure = false;
				}
			}
		},
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
			if (!pokemon.status) return;

			// if pokemon.showCure is undefined, it was skipped because its ability
			// is known
			if (pokemon.showCure === undefined) pokemon.showCure = true;

			if (pokemon.showCure) this.add('-curestatus', pokemon, pokemon.status, '[from] ability: Natural Heal');
			pokemon.setStatus('');

			// only reset .showCure if it's false
			// (once you know a Pokemon has Natural Cure, its cures are always known)
			if (!pokemon.showCure) pokemon.showCure = undefined;
		},
	},
	overseeingmonarch: {
		name: "Overseeing Monarch",
		desc: "On switch-in, identifies foes' items; on switch-out, restores 1/3 max HP.",
		onStart(pokemon) {
			for (const target of pokemon.side.foe.active) {
				if (!target || target.fainted) continue;
				if (target.item) {
					this.add('-item', target, target.getItem().name, '[from] ability: Overseeing Monarch', '[of] ' + pokemon, '[identify]');
				}
			}
		},
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
		},
	},
	porousfat: {
		id: "porousfat",
		name: "Porous Fat",
		shortDesc: "Fire/Ice/Water moves against this Pokemon deal damage with a halved attacking stat.",
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire' || move.type === 'Water') {
				this.debug('Porous Fat weaken');
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire' || move.type === 'Water') {
				this.debug('Porous Fat weaken');
				return this.chainModify(0.5);
			}
		},
	},
	
	//set 3
	nullsystem: {
		id: "nullsystem",
		name: "Null System",
		shortDesc: "This Pokemon can be any type (selected in teambuilder)."
	},
	inthicktrator: {
		id: "inthicktrator",
		name: "Inthicktrator",
		shortDesc: "This Pokemon's moves ignore Screens/Substitutes/Abilities.",
		onModifyMove(move, pokemon) {
			///////////PLACEHOLDER FOR STURDY MOLD
			let ignore = false;
			for (const target of pokemon.side.foe.active) {
				if (target.hasAbility('sturdymold')) {
					ignore = true;
					console.log("Target has Sturdy Mold");
					return;
				} else console.log("Target does not have Sturdy Mold");
			} 
			if ((move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') && ignore) return;
			///////////END PLACEHOLDER
			move.infiltrates = true;
			move.ignoreAbility = true;
		},
	},
	magicsurge: {
		id: "magicsurge",
		name: "Magic Surge",
		shortDesc: "Summons Magic Room for 5 turns when switching in.",
		onStart(source) {
			this.add('-activate', source, 'ability: Magic Surge');
			this.field.addPseudoWeather('magicroom');
		},
	},
	multiantlers: {
		id: "multiantlers",
		name: "Multi Antlers",
		shortDesc: "User takes half damage when switching in or at full HP.",
		onSourceModifyDamage(damage, source, target, move) {
			if (!target.activeTurns) {
				this.debug('Multi Antlers weaken');
				return this.chainModify(0.5);
			}
			else if (target.hp >= target.maxhp) {
				this.debug('Multi Antlers weaken');
				return this.chainModify(0.5);
			}
		},
	},
	concussion: {//test
		id: "concussion",
		name: "Concussion",
		shortDesc: "While this Pokemon is active, the opponents' held items have no effect.",
		onStart(source) {
			let activated = false;
			for (const pokemon of source.side.foe.active) {
				if (!activated) {
					this.add('-ability', source, 'Concussion');
				}
				activated = true;
				if (!pokemon.volatiles['embargo']) {
					pokemon.addVolatile('embargo');
				}
			}
		},
		onAnySwitchIn(pokemon) {
			const source = this.effectData.target;
			if (pokemon === source) return;
			for (const target of source.side.foe.active) {
				if (!target.volatiles['embargo']) {
					target.addVolatile('embargo');
				}
			}
		},
		onEnd(pokemon) {
			const source = this.effectData.target;
			for (const target of source.side.foe.active) {
				target.removeVolatile('embargo');
			}
		},
		rating: 4,
		num: 109,
	},
	notfunny: {
		id: "notfunny",
		name: "Not Funny",
		shortDesc: "No Guard + Prankster.",
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.category === 'Status') {
				if (target && target !== pokemon && target.hasAbility('sturdymold')) return;
				move.pranksterBoosted = true;
				return priority + 1;
			}
		},
		onAnyInvulnerabilityPriority: 1,
		onAnyInvulnerability(target, source, move) {
			if (move && (source === this.effectData.target || target === this.effectData.target)) return 0;
		},
		onAnyAccuracy(accuracy, target, source, move) {
			if (move && (source === this.effectData.target || target === this.effectData.target)) {
				return true;
			}
			return accuracy;
		},
	},
	fowlbehavior: {
		id: "fowlbehavior",
		name: "Fowl Behavior",
		shortDesc: "This Pokemon's Sp. Atk is 1.5x, but it can only select the first move it executes.",
		onStart(pokemon) {
			pokemon.abilityData.choiceLock = "";
		},
		onBeforeMove(pokemon, target, move) {
			if (move.isZOrMaxPowered || move.id === 'struggle') return;
			if (pokemon.abilityData.choiceLock && pokemon.abilityData.choiceLock !== move.id) {
				// Fails unless ability is being ignored (these events will not run), no PP lost.
				this.addMove('move', pokemon, move.name);
				this.attrLastMove('[still]');
				this.debug("Disabled by Fowl Behavior");
				this.add('-fail', pokemon);
				return false;
			}
		},
		onModifyMove(move, pokemon) {
			if (pokemon.abilityData.choiceLock || move.isZOrMaxPowered || move.id === 'struggle') return;
			pokemon.abilityData.choiceLock = move.id;
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, pokemon, move) {
			if (pokemon.volatiles['dynamax']) return;
			///////////PLACEHOLDER FOR STURDY MOLD
			let ignore = false;
			for (const target of pokemon.side.foe.active) {
				if (target.hasAbility('sturdymold')) {
					ignore = true;
					return;
				}
			} 
			if ((move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') && ignore) return;
			///////////END PLACEHOLDER
			// PLACEHOLDER
			this.debug('Fowl Behavior Sp. Atk Boost');
			return this.chainModify(1.5);
		},
		onDisableMove(pokemon) {
			if (!pokemon.abilityData.choiceLock) return;
			if (pokemon.volatiles['dynamax']) return;
			for (const moveSlot of pokemon.moveSlots) {
				if (moveSlot.id !== pokemon.abilityData.choiceLock) {
					pokemon.disableMove(moveSlot.id, false, this.effectData.sourceEffect);
				}
			}
		},
		onEnd(pokemon) {
			pokemon.abilityData.choiceLock = "";
		},
	},
	pillage: {
		id: "pillage",
		name: "Pillage",
		shortDesc: "On switch-in, swaps ability with the opponent.",
		onStart(pokemon) {
			if ((pokemon.side.foe.active.some(
				foeActive => foeActive && this.isAdjacent(pokemon, foeActive) && foeActive.ability === 'noability'
			))
			|| pokemon.species.id !== 'yaciancrowned' && pokemon.species.id !== 'porygrigus') {
				this.effectData.gaveUp = true;
			}
		},
		onUpdate(pokemon) {
			if (!pokemon.isStarted || this.effectData.gaveUp) return;
			const possibleTargets = pokemon.side.foe.active.filter(foeActive => foeActive && this.isAdjacent(pokemon, foeActive));
			while (possibleTargets.length) {
				let rand = 0;
				if (possibleTargets.length > 1) rand = this.random(possibleTargets.length);
				const target = possibleTargets[rand];
				const ability = target.getAbility();
				const additionalBannedAbilities = [
					// Zen Mode included here for compatability with Gen 5-6
					'noability', 'flowergift', 'forecast', 'hungerswitch', 'illusion', 'pillage',
					'imposter', 'neutralizinggas', 'powerofalchemy', 'receiver', 'trace', 'zenmode',
					'magicmissile', 'ecopy', 'lemegeton', 'modeshift',
				];
				if (target.getAbility().isPermanent || additionalBannedAbilities.includes(target.ability)) {
					possibleTargets.splice(rand, 1);
					continue;
				}
				target.setAbility('pillage', pokemon);
				pokemon.setAbility(ability);
				
				this.add('-activate', pokemon, 'ability: Pillage');
				this.add('-activate', pokemon, 'Skill Swap', '', '', '[of] ' + target);
				this.add('-activate', pokemon, 'ability: ' + ability.name);
				this.add('-activate', target, 'ability: Pillage');
				return;
			}
		},
	},
/*
	magneticwaves: {
		id: "magneticwaves",
		name: "Magnetic Waves",
		shortDesc: "Normal moves: Electric type, 1.2x power. Immune to Ground moves.",
		// airborneness implemented in sim/pokemon.js:Pokemon#isGrounded (via scripts.ts in this case)
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			///////////PLACEHOLDER FOR STURDY MOLD
			let ignore = false;
			for (const target of pokemon.side.foe.active) {
				if (target.hasAbility('sturdymold')) {
					ignore = true;
					return;
				} 
			} 
			if ((move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') && ignore) return;
			///////////END PLACEHOLDER
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Normal' && !noModifyType.includes(move.id) && !(move.isZ && move.category !== 'Status')) {
				move.type = 'Electric';
				move.galvanizeBoosted = true;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.galvanizeBoosted) return this.chainModify([0x1333, 0x1000]);
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Ground') {
				this.add('-immune', target, '[from] ability: Magnetic Waves');
				return null;
			}
		},
	},
*/
	doggysmaw: {
		id: "doggysmaw",
		name: "Doggy's Maw",
		shortDesc: "This Pokemon's Normal, Fighting and Dragon moves ignore type-based immunities and this Pokemon's Normal-type moves deal 1.5x damage.",
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Normal') {
				this.debug('Doggy\'s Maw boost');
				return this.chainModify(1.5);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Normal') {
				this.debug('Doggy\'s Maw boost');
				return this.chainModify(1.5);
			}
		},
		onModifyMovePriority: -5,
		onModifyMove(move, pokemon) {
			///////////PLACEHOLDER FOR STURDY MOLD
			let ignore = false;
			for (const target of pokemon.side.foe.active) {
				if (target.hasAbility('sturdymold')) {
					ignore = true;
					return;
				} 
			} 
			if ((move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') && ignore) return;
			///////////END PLACEHOLDER
			if (!move.ignoreImmunity) move.ignoreImmunity = {};
			if (move.ignoreImmunity !== true) {
				move.ignoreImmunity['Fighting'] = true;
				move.ignoreImmunity['Normal'] = true;
				move.ignoreImmunity['Dragon'] = true;
			}
		},
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate' || effect.id === 'scarilyadorable') {
				delete boost.atk;
				this.add('-immune', target, '[from] ability: Doggy\'s Maw');
			}
			if (effect.id === 'peckingorder') {
				delete boost.def;
				this.add('-immune', target, '[from] ability: Doggy\'s Maw');
			}
			if (effect.id === 'debilitate') {
				delete boost.spa;
				this.add('-immune', target, '[from] ability: Doggy\'s Maw');
			}
			if (effect.id === 'sinkorswim' || effect.id === 'scarilyadorable') {
				delete boost.spe;
				this.add('-immune', target, '[from] ability: Doggy\'s Maw');
			}
		},
	},
	//slate 5
	sturdymold: {//this one's gonna be a fucking adventure
		id: "sturdymold",
		name: "Sturdy Mold",
		shortDesc: "Sturdy + Mold Breaker.",
		onTryHit(pokemon, target, move) {
			if (move.ohko) {
				this.add('-immune', pokemon, '[from] ability: Sturdy Mold');
				return null;
			}
		},
		onDamagePriority: -100,
		onDamage(damage, target, source, effect) {
			if (target.hp === target.maxhp && damage >= target.hp && effect && effect.effectType === 'Move') {
				this.add('-ability', target, 'Sturdy Mold');
				return target.hp - 1;
			}
		},
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Sturdy Mold');
		},
		onModifyMove(move) {
			move.ignoreAbility = true;
		},
		//I'm gonna figure out how to code this legit at some point, I swear,
		//but for now, since we have so few abilities,
		//I'm just gonna hard-code it into everything.
	},
	therapeutic: {
		id: "therapeutic",
		name: "Therapeutic",
		shortDesc: "Unburden + Poison Heal. Upon losing its item, this Pokemon poisons itself.",
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			if (effect.id === 'psn' || effect.id === 'tox') {
				this.heal(target.baseMaxhp / 8);
				return false;
			}
		},
		onAfterUseItem(item, pokemon) {
			if (pokemon !== this.effectData.target) return;
			pokemon.addVolatile('unburden');
			pokemon.trySetStatus('psn', pokemon);
		},
		onTakeItem(item, pokemon) {
			pokemon.addVolatile('unburden');
			pokemon.trySetStatus('psn', pokemon);
		},
		onEnd(pokemon) {
			pokemon.removeVolatile('unburden');
		},
		condition: {
			onModifySpe(spe, pokemon) {
				if (!pokemon.item) {
					return this.chainModify(2);
				}
			},
		},
	},
	solarpanel: {
		id: "solarpanel",
		name: "Solar Panel",
		shortDesc: "If hit by Grass, Electric or Fire: +1 SpA. Grass/Electric/Fire immunity.",
		onTryHit(target, source, move) {
			if (target !== source && (move.type === 'Electric' || move.type === 'Fire')) {
				if (!this.boost({spa: 1})) {
					this.add('-immune', target, '[from] ability: Solar Panel');
				}
				return null;
			}
		},
	},
	//For purposes of cancelling this ability out for Sturdy Mold:
	toughclaws: {
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['contact'] && !defender.hasAbility('sturdymold')) {
				return this.chainModify([0x14CD, 0x1000]);
			}
		},
		name: "Tough Claws",
		rating: 3.5,
		num: 181,
	},
	hustle: {
		// This should be applied directly to the stat as opposed to chaining with the others
		onModifyAtkPriority: 5,
		onModifyAtk(atk, pokemon, move) {
			///////////PLACEHOLDER FOR STURDY MOLD
			let ignore = false;
			for (const target of pokemon.side.foe.active) {
				if (target.hasAbility('sturdymold')) {
					ignore = true;
					return;
				} 
			} 
			if ((move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') && ignore) return;
			///////////END PLACEHOLDER
			return this.modify(atk, 1.5);
		},
		onSourceModifyAccuracyPriority: 7,
		onSourceModifyAccuracy(accuracy, target, source, move) {
			if (move.category === 'Physical' && typeof accuracy === 'number' && !target.hasAbility('sturdymold')) {
				return accuracy * 0.8;
			}
		},
		name: "Hustle",
		rating: 3.5,
		num: 55,
	},
	scrappy: {
		onModifyMovePriority: -5,
		onModifyMove(move, pokemon) {
			///////////PLACEHOLDER FOR STURDY MOLD
			let ignore = false;
			for (const target of pokemon.side.foe.active) {
				if (target.hasAbility('sturdymold')) {
					ignore = true;
					return;
				} 
			} 
			if ((move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') && ignore) return;
			///////////END PLACEHOLDER
			if (!move.ignoreImmunity) move.ignoreImmunity = {};
			if (move.ignoreImmunity !== true) {
				move.ignoreImmunity['Fighting'] = true;
				move.ignoreImmunity['Normal'] = true;
			}
		},
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate') {
				delete boost.atk;
				this.add('-immune', target, "[from] ability: Scrappy");
			} else if (effect.id === 'debilitate') {
				delete boost.spa; 
				this.add('-immune', target, "[from] ability: Scrappy");
			} else if (effect.id === 'sinkorswim') {
				delete boost.spe; 
				this.add('-immune', target, "[from] ability: Scrappy");
			}
		},
		name: "Scrappy",
		rating: 3,
		num: 113,
	},
	sandforce: {
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (this.field.isWeather('sandstorm')) {
				if (defender && defender.hasAbility('sturdymold')) return;
				if (move.type === 'Rock' || move.type === 'Ground' || move.type === 'Steel') {
					this.debug('Sand Force boost');
					return this.chainModify([0x14CD, 0x1000]);
				}
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'sandstorm') return false;
		},
		name: "Sand Force",
		rating: 2,
		num: 159,
	},
	//next
	noguard: {//Edited for Sturdy Mold
		onAnyInvulnerabilityPriority: 1,
		onAnyInvulnerability(target, source, move) {
			if (move && (source === this.effectData.target || target === this.effectData.target) && !target.hasAbility('sturdymold')) return 0;
		},
		onAnyAccuracy(accuracy, target, source, move) {
			if (move && (source === this.effectData.target || target === this.effectData.target) && !target.hasAbility('sturdymold')) {
				return true;
			}
			return accuracy;
		},
		name: "No Guard",
		rating: 4,
		num: 99,
	},
	bigpressure: {
		name: "Big Pressure",
		shortDesc: "Moves targeting this Pokemon lose 1 additional PP; Foes cannot lower its Defense.",
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Big Pressure');
		},
		onDeductPP(target, source) {
			if (target.side === source.side) return;
			return 1;
		},
		onBoost(boost, target, source, effect) {
			if (source && target === source) return;
			if (boost.def && boost.def < 0) {
				delete boost.def;
				if (!(effect as ActiveMove).secondaries && effect.id !== 'octolock') {
					this.add("-fail", target, "unboost", "Defense", "[from] ability: Big Pecks", "[of] " + target);
				}
			}
		},
	},
	friendshield: {
		name: "Friend Shield",
		shortDesc: "Gets +1 Def and SpD on switch-in. Allies recieve 3/4 damage from foes' attacks.",
		onStart(pokemon) {
			this.boost({def: 1, spd: 1}, pokemon);
		},
		onAnyModifyDamage(damage, source, target, move) {
			if (target !== this.effectData.target && target.side === this.effectData.target.side) {
				this.debug('Friend Shield weaken');
				return this.chainModify(0.75);
			}
		},
	},
	debilitate: {
		name: "Debilitate",
		shortDesc: "On switch-in, this Pokemon lowers the Special Attack of adjacent opponents by 1 stage.",
		onStart(pokemon) {
			let activated = false;
			for (const target of pokemon.side.foe.active) {
				if (!target || !this.isAdjacent(target, pokemon)) continue;
				if (!activated) {
					this.add('-ability', pokemon, 'Debilitate', 'boost');
					activated = true;
				}
				if (target.volatiles['substitute']) {
					this.add('-immune', target);
				} else {
					this.boost({spa: -1}, target, pokemon, null, true);
				}
			}
		},
	},
	leafyarmor: {//unsure
		name: "Leafy Armor",
		shortDesc: "If a status condition is inflicted on this Pokemon: Cure status, -1 Defense, +2 Speed.",
		onUpdate(pokemon) {
			if (pokemon.status && !pokemon.m.orbItemStatus) {
				this.add('-activate', pokemon, 'ability: Leafy Armor');
				pokemon.cureStatus();
				this.boost({def: -1, spe: 2}, pokemon, pokemon); 
			}
		},
	},
	surroundsound: {//unsure
		name: "Surround Sound",
		shortDesc: "This Pokemon recieves 1/2 damage from multitarget moves. Its own have 1.3x power.",
		onBasePowerPriority: 7,
		onBasePower(basePower, attacker, defender, move) {
			if (['allAdjacent', 'allAdjacentFoes', 'all'].includes(move.target)) {
				if (defender.hasAbility('sturdymold')) return;
				this.debug('Surround Sound boost');
				return this.chainModify([0x14CD, 0x1000]);
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (['allAdjacent', 'allAdjacentFoes', 'all'].includes(move.target)) {
				this.debug('Surround Sound weaken');
				return this.chainModify(0.5);
			}
		},
	},
	spikyhold: {
		name: "Spiky Hold",
		shortDesc: "Cannot lose held item due to others' attacks; others making contact lose 1/8 max HP.",
		onTakeItem(item, pokemon, source) {
			if (this.suppressingAttackEvents(pokemon) || !pokemon.hp || pokemon.item === 'stickybarb') return;
			if (!this.activeMove) throw new Error("Battle.activeMove is null");
			if ((source && source !== pokemon) || this.activeMove.id === 'knockoff') {
				this.add('-activate', pokemon, 'ability: Spiky Hold');
				return false;
			}
		},
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (move.flags['contact']) {
				this.damage(source.baseMaxhp / 8, source, target);
			}
		},
	},

	//slate 7
	sinkorswim: {
		name: "Sink or Swim",
		shortDesc: "On switch-in, lowers adjacent opponents' Speed by 1 stage.",
		onStart(pokemon) {
			let activated = false;
			for (const target of pokemon.side.foe.active) {
				if (!target || !this.isAdjacent(target, pokemon)) continue;
				if (!activated) {
					this.add('-ability', pokemon, 'Sink or Swim', 'boost');
					activated = true;
				}
				if (target.volatiles['substitute']) {
					this.add('-immune', target);
				} else {
					this.boost({spe: -1}, target, pokemon, null, true);
				}
			}
		},
	},
	downpour: {
		name: "Downpour",
		shortDesc: "If targeted by a foe's move: move loses 1 extra PP, this Pokemon restores 1/16 max HP.",
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Downpour');
		},
		onDeductPP(target, source) {
			if (target.side === source.side) return;
			this.heal(target.baseMaxhp / 16);
			return 1;
		},
		rating: 2.5,
		num: 46,
	},
	/* //No longer in use
	overclock: {
		name: "Overclock",
		shortDesc: "If stats are lowered by foe or if hit by Electric move: Atk +2.",
		onAfterEachBoost(boost, target, source, effect) {
			if (!source || target.side === source.side) {
				if (effect.id === 'stickyweb') {
					this.hint("Court Change Sticky Web counts as lowering your own Speed, and Defiant only affects stats lowered by foes.", true, source.side);
				}
				return;
			}
			let statsLowered = false;
			let i: BoostName;
			for (i in boost) {
				if (boost[i]! < 0) {
					statsLowered = true;
				}
			}
			if (statsLowered) {
				this.add('-ability', target, 'Overclock');
				this.boost({atk: 2}, target, target, null, true);
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (move.type === 'Electric') {
				this.boost({atk: 2});
			}
		},
	},
	*/
	magicmissile: {
		/*
		Need to test:
		- any Berry
		- Toxic Orb, Flame Orb or Light Ball (just one they're the same code)
		- White Herb
		- Mental Herb
		- um, I guess making sure Razor Claw or Razor Fang (just one they're the same code) doesn't immediately crash,
		but it would be basically impossible for them to cause a flinch in a singles context
		(how does this behave with Instruct? maybe you could test with that if you're doing the doubles format Aquatic mentioned)
		*/
		name: "Magic Missile",
		shortDesc: "If hit by a contact move while holding an item: lose item, apply item Fling effects, attacker loses 1/4 max HP. If hitting a foe with a contact move while not holding an item: steals the foe's item.",
		onSourceHit(target, source, move) {
			if (!move || !target) return;
			if (target !== source && move.category !== 'Status') {
				if (source.item || source.volatiles['gem'] || move.id === 'fling') return;
				const yourItem = target.takeItem(source);
				if (!yourItem) return;
				if (!source.setItem(yourItem)) {
					target.item = yourItem.id; // bypass setItem so we don't break choicelock or anything
					return;
				}
				this.add('-item', source, yourItem, '[from] ability: Magic Missile', '[of] ' + target);
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (target.isSemiInvulnerable()) return;
			if (target.ignoringItem()) return false;
			const item = target.getItem();
			if (!this.singleEvent('TakeItem', item, target.itemData, target, target, move, item)) return false;
			if (item.id && !item.megaStone) {
				this.damage(source.baseMaxhp / 4, source, target);
				target.addVolatile('fling');
				if (item.isBerry) {
					if (this.singleEvent('Eat', item, null, source, null, null)) {
						this.runEvent('EatItem', source, null, null, item);
						if (item.id === 'leppaberry') source.staleness = 'external';
					}
					if (item.onEat) source.ateBerry = true;
				} else if (item.id === 'mentalherb') {
					const conditions = ['attract', 'taunt', 'encore', 'torment', 'disable', 'healblock'];
					for (const firstCondition of conditions) {
						if (source.volatiles[firstCondition]) {
							for (const secondCondition of conditions) {
								source.removeVolatile(secondCondition);
								if (firstCondition === 'attract' && secondCondition === 'attract') {
									this.add('-end', source, 'move: Attract', '[from] item: Mental Herb');
								}
							}
							return;
						}
					}
				} else if (item.id === 'whiteherb') {
					let activate = false;
					const boosts: SparseBoostsTable = {};
					let i: BoostName;
					for (i in source.boosts) {
						if (source.boosts[i] < 0) {
							activate = true;
							boosts[i] = 0;
						}
					}
					if (activate) {
						source.setBoost(boosts);
						this.add('-clearnegativeboost', source, '[silent]');
					}
				} else {
					if (item.fling && item.fling.status) {
						source.trySetStatus(item.fling.status, target);
					} else if (item.fling && item.fling.volatileStatus) {
						source.addVolatile(item.fling.volatileStatus, target);
					}
				}
			}
		},
	},
	//slate 8
	fatproof: {
		name: "Fat Proof",
		shortDesc: "Ice, Fire attacks against this Pokemon use a halved attack stat; Fire moves 1/2 BP.",
		onSourceBasePowerPriority: 18,
		onSourceBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Fire') {
				return this.chainModify(0.5);
			}
		},
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire') {
				this.debug('Fat Proof weaken');
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire') {
				this.debug('Fat Proof weaken');
				return this.chainModify(0.5);
			}
		},
		onDamage(damage, target, source, effect) {
			if (effect && effect.id === 'brn') {
				return damage / 2;
			}
		},
	},
	leviflame: {
		name: "Leviflame",
		shortDesc: "30% chance a Pokemon making contact with this Pokemon will be burned. Immune to Ground.",
		onDamagingHit(damage, target, source, move) {
			if (move.flags['contact']) {
				if (this.randomChance(3, 10)) {
					source.trySetStatus('brn', target);
				}
			}
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Ground') {
				this.add('-immune', target, '[from] ability: Leviflame');
				return null;
			}
		},
	},
	prophylaxis: {
		name: "Prophylaxis",
		shortDesc: "Regenerator + Anticipation.",
		onStart(pokemon) {
			for (const target of pokemon.side.foe.active) {
				if (!target || target.fainted) continue;
				for (const moveSlot of target.moveSlots) {
					const move = this.dex.getMove(moveSlot.move);
					if (move.category === 'Status') continue;
					const moveType = move.id === 'hiddenpower' ? target.hpType : move.type;
					if (
						this.dex.getImmunity(moveType, pokemon) && this.dex.getEffectiveness(moveType, pokemon) > 0 ||
						move.ohko
					) {
						this.add('-ability', pokemon, 'Prophylaxis');
						return;
					}
				}
			}
		},
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
		},	
	},
	feelnopain: {
		name: "Feel No Pain",
		shortDesc: "Poison Heal + Levitate",
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			if (effect.id === 'psn' || effect.id === 'tox') {
				this.heal(target.baseMaxhp / 8);
				return false;
			}
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Ground') {
				this.add('-immune', target, '[from] ability: Feel No Pain');
				return null;
			}
		},
	},
	erosion: {
		name: "Erosion",
		shortDesc: "Draws Electric moves to itself to raise SpA by 1; Electric immunity; summons Sandstorm on entry.",
		onStart(source) {
			this.field.setWeather('sandstorm');
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Electric') {
				if (!this.boost({spa: 1})) {
					this.add('-immune', target, '[from] ability: Erosion');
				}
				return null;
			}
		},
		onAnyRedirectTarget(target, source, source2, move) {
			if (move.type !== 'Electric' || ['firepledge', 'grasspledge', 'waterpledge'].includes(move.id)) return;
			const redirectTarget = ['randomNormal', 'adjacentFoe'].includes(move.target) ? 'normal' : move.target;
			if (this.validTarget(this.effectData.target, source, redirectTarget)) {
				if (move.smartTarget) move.smartTarget = false;
				if (this.effectData.target !== target) {
					this.add('-activate', this.effectData.target, 'ability: Erosion');
				}
				return this.effectData.target;
			}
		},
	},
	statusabsorbtion: {
		name: "Status Absorbtion",
		shortDesc: "This Pokemon is immune to being Poisoned or Burned.",
		onUpdate(pokemon) {
			if (pokemon.status === 'psn' || pokemon.status === 'tox' || pokemon.status === 'brn') {
				this.add('-activate', pokemon, 'ability: Status Absorbtion');
				pokemon.cureStatus();
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== 'psn' && status.id !== 'tox' && status.id !== 'brn') return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Status Absorbtion');
			}
			return false;
		},
	},
	levitability: {
		name: "Levitability",
		shortDesc: "STAB moves are boosted an additional 1.5x; immune to Ground.",
		onModifyMove(move, pokemon) {
			///////////PLACEHOLDER FOR STURDY MOLD
			let ignore = false;
			for (const target of pokemon.side.foe.active) {
				if (target.hasAbility('sturdymold')) {
					ignore = true;
					return;
				} 
			} 
			if ((move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') && ignore) return;
			///////////END PLACEHOLDER
			move.stab = 2;
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Ground') {
				this.add('-immune', target, '[from] ability: Levitability');
				return null;
			}
		},
	},
	//Implement immunity for Intimidate clones: 
	innerfocus: {
		inherit: true,
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate') {
				delete boost.atk;
				this.add('-immune', target, '[from] ability: Inner Focus');
			} else if (effect.id === 'debilitate') {
				delete boost.spa; 
				this.add('-immune', target, '[from] ability: Inner Focus');
			} else if (effect.id === 'sinkorswim') {
				delete boost.spe; 
				this.add('-immune', target, '[from] ability: Inner Focus');
			}
		},
	},
	oblivious: {
		inherit: true,
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate') {
				delete boost.atk;
				this.add('-immune', target, '[from] ability: Oblivious');
			} else if (effect.id === 'debilitate') {
				delete boost.spa; 
				this.add('-immune', target, '[from] ability: Oblivious');
			} else if (effect.id === 'sinkorswim') {
				delete boost.spe; 
				this.add('-immune', target, '[from] ability: Oblivious');
			}
		},
	},
	owntempo: {
		inherit: true,
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate') {
				delete boost.atk;
				this.add('-immune', target, '[from] ability: Own Tempo');
			} else if (effect.id === 'debilitate') {
				delete boost.spa; 
				this.add('-immune', target, '[from] ability: Own Tempo');
			} else if (effect.id === 'sinkorswim') {
				delete boost.spe; 
				this.add('-immune', target, '[from] ability: Own Tempo');
			}
		},
	},
	rattled: {
		inherit: true,
		onAfterBoost(boost, target, source, effect) {
			if (effect && ['intimidate', 'debilitate', 'sinkorswim', 'scarilyadorable', 'peckingorder'].includes(effect.id)) {
				this.boost({spe: 1});
			}
		},
	},
	//new slate
	chivalry: {
		shortDesc: "For each stat lowered by a foe: +2 Atk, +1 Spe.",
		onAfterEachBoost(boost, target, source, effect) {
			if (!source || target.side === source.side) {
				if (effect.id === 'stickyweb') {
					this.hint("Court Change Sticky Web counts as lowering your own Speed, and Defiant only affects stats lowered by foes.", true, source.side);
				}
				return;
			}
			let statsLowered = false;
			for (let i in boost) {
				// @ts-ignore
				if (boost[i] < 0) {
					statsLowered = true;
				}
			}
			if (statsLowered) {
				this.add('-ability', target, 'Chivalry');
				this.boost({atk: 2, spe: 1}, target, target, null, true);
			}
		},
		name: "Chivalry",
	},
	hauntedtech: {
		shortDesc: "Moves 60 power or less: 1.5x power. If hit by an attack, 30% chance to disable that move.",
		name: "Haunted Tech",
		onBasePowerPriority: 30,
		onBasePower(basePower, attacker, defender, move) {
			if (defender.hasAbility('sturdymold')) return;
			const basePowerAfterMultiplier = this.modify(basePower, this.event.modifier);
			this.debug('Base Power: ' + basePowerAfterMultiplier);
			if (basePowerAfterMultiplier <= 60) {
				this.debug('Technician boost');
				return this.chainModify(1.5);
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (source.volatiles['disable']) return;
			if (!move.isFutureMove) {
				if (this.randomChance(3, 10)) {
					source.addVolatile('disable', this.effectData.target);
				}
			}
		},
	},
	stickyfloat: {
		//Groundedness implemented in scripts.ts
		onTakeItem(item, pokemon, source) {
			if (this.suppressingAttackEvents(pokemon) || !pokemon.hp || pokemon.item === 'stickybarb') return;
			if (!this.activeMove) throw new Error("Battle.activeMove is null");
			if ((source && source !== pokemon) || this.activeMove.id === 'knockoff') {
				this.add('-activate', pokemon, 'ability: Sticky Float');
				return false;
			}
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Ground') {
				this.add('-immune', target, '[from] ability: Sticky Float');
				return null;
			}
		},
		name: "Sticky Float",
		shortDesc: "Effects of Sticky Hold + Levitate",
	},
	terrorizer: {
		onModifyMove(move, pokemon) {
			if (move.secondaries) {
				delete move.secondaries;
				// Technically not a secondary effect, but it is negated
				delete move.self;
				if (move.id === 'clangoroussoulblaze') delete move.selfBoost;
				// Actual negation of `AfterMoveSecondary` effects implemented in scripts.js
				move.hasSheerForce = true;
			}
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, pokemon, target, move) {
			if (move.hasSheerForce) return this.chainModify([0x14CD, 0x1000]);
		},
		onDamagingHit(damage, target, source, move) {
			if (source.volatiles['disable']) return;
			if (!move.isFutureMove) {
				if (this.randomChance(3, 10)) {
					source.addVolatile('disable', this.effectData.target);
				}
			}
		},
		name: "Terrorizer",
		shortDesc: "Sheer Force + Cursed Body",
	},
	darkhumour: {
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.category === 'Status') {
				move.pranksterBoosted = true;
				return priority + 1;
			}
		},
		onTryHit(target, source, move) {
			if (move.category !== 'Status') {
				return;
			}
			this.add('-ability', target, 'Dark Humour');
			this.boost({atk: 1}, target, target, null, true);
		},
		name: "Dark Humour",
		shortDesc: "Status moves +1 priority. If targeted by a status move, +1 Atk.",
	},
	speedy: {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.boost({spe: length}, source);
			}
		},
		name: "Speedy",
		shortDesc: "Speed raises by 1 stage if it attacks and KO's another Pokemon.",
	},
	ultrahealth: {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.add('-activate', source, 'ability: Ultra Health'); 
				this.heal(source.baseMaxhp / 3, source, source, effect);
			}
		},
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
		},
		name: "Ultra Health",
		shortDesc: "On switching out or landing a KO, heal for 1/3 max HP.",
	},
	dustdevil: {
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Fire') {
				move.accuracy = true;
				if (!target.addVolatile('dustdevil')) {
					this.add('-immune', target, '[from] ability: Dust Devil');
				}
				return null;
			}
		},
		onEnd(pokemon) {
			pokemon.removeVolatile('dustdevil');
		},
		condition: {
			noCopy: true, // doesn't get copied by Baton Pass
			onStart(target) {
				this.add('-start', target, 'ability: Dust Devil');
			},
			onModifyAtkPriority: 5,
			onModifyAtk(atk, attacker, defender, move) {
				if (move.type === 'Fire' && attacker.hasAbility('dustdevil')) {
					this.debug('Dust Devil boost');
					return this.chainModify(1.5);
				}
			},
			onModifySpAPriority: 5,
			onModifySpA(atk, attacker, defender, move) {
				if (move.type === 'Fire' && attacker.hasAbility('dustdevil')) {
					this.debug('Dust Devil boost');
					return this.chainModify(1.5);
				}
			},
			onEnd(target) {
				this.add('-end', target, 'ability: Dust Devil', '[silent]');
			},
		},
		onModifySpe(spe, pokemon) {
			if (this.field.isWeather('sandstorm')) {
				return this.chainModify(2);
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'sandstorm') return false;
		},
		name: "Dust Devil",
		shortDesc: "Effects of Sand Rush and Flash Fire.",
	},
	solidskill: {
		onSourceModifyDamage(damage, source, target, move) {
			if ((target.getMoveHitData(move).typeMod > 0) || move.multihit) {
				this.debug('Solid Skill neutralize');
				return this.chainModify(0.75);
			}
		},
		name: "Solid Skill",
		shortDesc: "3/4 damage from super-effective and multihit moves.",
	},
	modeshift: {
		onStart(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== 'Sableior' || pokemon.transformed) return;
			if (pokemon.species.forme !== 'Meteor') {
					pokemon.formeChange('Sableior-Meteor');
			} else {
				if (pokemon.species.forme === 'Meteor') {
					pokemon.formeChange(pokemon.set.species);
				}
			}
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.category === 'Status') {
				move.pranksterBoosted = true;
				return priority + 1;
			}
		},
		onBeforeMovePriority: 0.5,
		onBeforeMove(attacker, defender, move) {
			if (attacker.species.baseSpecies !== 'Sableior' || attacker.transformed) return;
			const targetForme = (move.category === 'Status' ? 'Sableior-Meteor' : 'Sableior');
			if (attacker.species.name !== targetForme) attacker.formeChange(targetForme);
			if (attacker.canMegaEvo) {
				attacker.canMegaEvo = (targetForme === 'Sableior-Meteor' ? 'sableiormeteormega' : 'sableiormega');
			}
		},
		isPermanent: true,
		name: "Mode Shift",
		shortDesc: "Status moves +1 priority. Changes to Meteor Form before using a status move.",
	},
	lemegeton: {
		// Ability suppression implemented in sim/pokemon.ts:Pokemon#ignoringAbility
		// TODO Will abilities that already started start again? (Intimidate seems like a good test case)
		onPreStart(pokemon) {
			this.add('-ability', pokemon, 'Lemegeton');
			pokemon.abilityData.ending = false;
			for (const target of this.getAllActive()) {
				if (target.illusion) {
					this.singleEvent('End', this.dex.getAbility('Illusion'), target.abilityData, target, pokemon, 'lemegeton');
				}
				if (target.volatiles['slowstart']) {
					delete target.volatiles['slowstart'];
					this.add('-end', target, 'Slow Start', '[silent]');
				}
			}
		},
		onEnd(source) {
			// FIXME this happens before the pokemon switches out, should be the opposite order.
			// Not an easy fix since we cant use a supported event. Would need some kind of special event that
			// gathers events to run after the switch and then runs them when the ability is no longer accessible.
			// (If your tackling this, do note extreme weathers have the same issue)

			// Mark this pokemon's ability as ending so Pokemon#ignoringAbility skips it
			source.abilityData.ending = true;
			for (const pokemon of this.getAllActive()) {
				if (pokemon !== source) {
					// Will be suppressed by Pokemon#ignoringAbility if needed
					this.singleEvent('Start', pokemon.getAbility(), pokemon.abilityData, pokemon);
				}
			}
		},
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				let statName = 'atk';
				let bestStat = 0;
				let s: StatNameExceptHP;
				for (s in source.storedStats) {
					if (source.storedStats[s] > bestStat) {
						statName = s;
						bestStat = source.storedStats[s];
					}
				}
				this.boost({[statName]: length}, source);
			}
		},
		name: "Lemegeton",
		shortDesc: "Beast Boost + Neutralizing Gas",
	},
	//a
	magicbeast: {
		onTryHitPriority: 1,
		onTryHit(target, source, move) {
			if (target === source || move.hasBounced || !move.flags['reflectable']) {
				return;
			}
			const newMove = this.dex.getActiveMove(move.id);
			newMove.hasBounced = true;
			newMove.pranksterBoosted = false;
			this.useMove(newMove, target, source);
			return null;
		},
		onAllyTryHitSide(target, source, move) {
			if (target.side === source.side || move.hasBounced || !move.flags['reflectable']) {
				return;
			}
			const newMove = this.dex.getActiveMove(move.id);
			newMove.hasBounced = true;
			newMove.pranksterBoosted = false;
			this.useMove(newMove, this.effectData.target, source);
			return null;
		},
		condition: {
			duration: 1,
		},
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				let statName = 'atk';
				let bestStat = 0;
				let s: StatNameExceptHP;
				for (s in source.storedStats) {
					if (source.storedStats[s] > bestStat) {
						statName = s;
						bestStat = source.storedStats[s];
					}
				}
				this.boost({[statName]: length}, source);
			}
		},
		name: "Magic Beast",
		shortDesc: "Magic Bounce + Beast Boost.",
	},
	soundneigh: {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.boost({atk: length}, source);
			}
		},
		onTryHit(target, source, move) {
			if (move.target !== 'self' && move.flags['sound']) {
				this.add('-immune', target, '[from] ability: Sound Neigh');
				return null;
			}
		},
		onAllyTryHitSide(target, source, move) {
			if (move.flags['sound']) {
				this.add('-immune', this.effectData.target, '[from] ability: Sound Neigh');
			}
		},
		name: "Sound Neigh",
		shortDesc: "Chilling Neigh + Soundproof.",
	},
	ecopy: {
		onStart(pokemon) {
			this.field.setTerrain('electricterrain');
			
			if (pokemon.side.foe.active.some(
				foeActive => foeActive && this.isAdjacent(pokemon, foeActive) && foeActive.ability === 'noability'
			)) {
				this.effectData.gaveUp = true;
			}
		},
		onUpdate(pokemon) {
			if (!pokemon.isStarted || this.effectData.gaveUp) return;
			const possibleTargets = pokemon.side.foe.active.filter(foeActive => foeActive && this.isAdjacent(pokemon, foeActive));
			while (possibleTargets.length) {
				let rand = 0;
				if (possibleTargets.length > 1) rand = this.random(possibleTargets.length);
				const target = possibleTargets[rand];
				const ability = target.getAbility();
				const additionalBannedAbilities = [
					// Zen Mode included here for compatability with Gen 5-6
					'noability', 'flowergift', 'forecast', 'hungerswitch', 'illusion', 
					'imposter', 'neutralizinggas', 'powerofalchemy', 'receiver', 'trace', 'zenmode',
					'magicmissile', 'pillage', 'ecopy', 'lemegeton', 'modeshift', 
				];
				if (target.getAbility().isPermanent || additionalBannedAbilities.includes(target.ability)) {
					possibleTargets.splice(rand, 1);
					continue;
				}
				this.add('-ability', pokemon, ability, '[from] ability: E-Copy', '[of] ' + target);
				pokemon.setAbility(ability);
				return;
			}
		},
		name: "E-Copy",
		shortDesc: "Sets Electric Terrain, and then copies the foe's Ability.",
	},
	wetbugs: {
		onStart(source) {
			for (const action of this.queue) {
				if (action.choice === 'runPrimal' && action.pokemon === source && source.species.id === 'kyottler') return;
				if (action.choice !== 'runSwitch' && action.choice !== 'runPrimal') break;
			}
			this.field.setWeather('raindance');
		},
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Bug' && attacker.hp <= attacker.maxhp / 3) {
				if (defender.hasAbility('sturdymold')) return;
				this.debug('Swarm boost');
				return this.chainModify(1.5);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Bug' && attacker.hp <= attacker.maxhp / 3) {
				if (defender.hasAbility('sturdymold')) return;
				this.debug('Swarm boost');
				return this.chainModify(1.5);
			}
		},
		name: "Wet Bugs",
		shortDesc: "Drizzle + Swarm.",
	},
	hydrauliccannon: {
		onModifySpe(spe, pokemon) {
			if (['raindance', 'primordialsea'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(2);
			}
		},
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (defender.hasAbility('sturdymold')) return;
			if (move.flags['pulse']) {
				return this.chainModify(1.5);
			}
		},
		name: "Hydraulic Cannon",
		shortDesc: "Mega Launcher + Swift Swim.",
	},
	//more fix
	solarpower: {
		onModifySpAPriority: 5,
		onModifySpA(spa, pokemon, move) {
			///////////PLACEHOLDER FOR STURDY MOLD
			let ignore = false;
			for (const target of pokemon.side.foe.active) {
				if (target.hasAbility('sturdymold')) {
					ignore = true;
					return;
				}
			} 
			if ((move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') && ignore) return;
			///////////END PLACEHOLDER
			if (['sunnyday', 'desolateland'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(1.5);
			}
		},
		onWeather(target, source, effect) {
			if (target.hasItem('utilityumbrella')) return;
			if (effect.id === 'sunnyday' || effect.id === 'desolateland') {
				this.damage(target.baseMaxhp / 8, target, target);
			}
		},
		name: "Solar Power",
		rating: 2,
		num: 94,
	},
	skilllink: {
		onModifyMove(move, pokemon) {
			///////////PLACEHOLDER FOR STURDY MOLD
			let ignore = false;
			for (const target of pokemon.side.foe.active) {
				if (target.hasAbility('sturdymold')) {
					ignore = true;
					return;
				} 
			} 
			if ((move.target === 'allAdjacentFoes' || move.target === 'allAdjacent') && ignore) return;
			///////////END PLACEHOLDER
			if (move.multihit && Array.isArray(move.multihit) && move.multihit.length) {
				move.multihit = move.multihit[1];
			}
			if (move.multiaccuracy) {
				delete move.multiaccuracy;
			}
		},
		name: "Skill Link",
		rating: 3,
		num: 92,
	},
	technician: {
		onBasePowerPriority: 30,
		onBasePower(basePower, attacker, defender, move) {
			if (defender.hasAbility('sturdymold')) return;
			const basePowerAfterMultiplier = this.modify(basePower, this.event.modifier);
			this.debug('Base Power: ' + basePowerAfterMultiplier);
			if (basePowerAfterMultiplier <= 60) {
				this.debug('Technician boost');
				return this.chainModify(1.5);
			}
		},
		name: "Technician",
		rating: 3.5,
		num: 101,
	},
	battletheme: {
		onBeforeMovePriority: 0.5,
		onBeforeMove(attacker, defender, move) {
			if (attacker.species.baseSpecies !== 'Meloslash' || attacker.transformed) return;
			if (move.category === 'Status' && move.id !== 'kingsshield') return;
			const targetForme = ((move.secondaries || move.id === 'kingsshield') ? 'Meloslash' : 'Meloslash-Melee');
			if (attacker.species.name !== targetForme) attacker.formeChange(targetForme);
			if (move.id === 'relicsong') {
				move.willChangeForme = true;
			}
		},
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (move.willChangeForme) {
				pokemon.formeChange('Meloslash-Melee');
			}
		},
		onModifyMovePriority: -2,
		onModifyMove(move) {
			if (move.secondaries) {
				this.debug('doubling secondary chance');
				for (const secondary of move.secondaries) {
					if (secondary.chance) secondary.chance *= 2;
				}
			}
			if (move.self?.chance) move.self.chance *= 2;
		},
		isPermanent: true,
		name: "Battle Theme",
		shortDesc: "If Meloslash: change forme to Range before using move with secondary, change form to Melee otherwise. Secondary effect chances are doubled.",
	},
	flashyjokes: {
		shortDesc: "Flash Fire + Prankster.",
		name: "Flashy Jokes",
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Fire') {
				move.accuracy = true;
				if (!target.addVolatile('flashfire')) {
					this.add('-immune', target, '[from] ability: Flashy Jokes');
				}
				return null;
			}
		},
		onEnd(pokemon) {
			pokemon.removeVolatile('flashfire');
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.category === 'Status') {
				move.pranksterBoosted = true;
				return priority + 1;
			}
		},
	},
	teachingtech: {
		onBasePowerPriority: 30,
		onBasePower(basePower, attacker, defender, move) {
			if (defender.hasAbility('sturdymold')) return;
			const basePowerAfterMultiplier = this.modify(basePower, this.event.modifier);
			this.debug('Base Power: ' + basePowerAfterMultiplier);
			if (basePowerAfterMultiplier <= 60) {
				this.debug('Technician boost');
				return this.chainModify(1.5);
			}
		},
		onSourceHit(target, source, move) {
			if (!move || !target || move.category === 'Status') return;
			console.log('Teaching Tech: Move BP = ' + move.basePower);
			const targetAbility = target.getAbility();
			if (targetAbility.isPermanent || targetAbility.id === 'teachingtech') return;
			if (move.basePower <= 60) {
				const oldAbility = target.setAbility('teachingtech', source);
				if (oldAbility) {
					this.add('-activate', source, 'ability: Teaching Tech');
					this.add('-activate', target, 'ability: Teaching Tech');
				}
			}
		},
		name: "Teaching Tech",
		shortDesc: "Moves <=60 BP: 1.5x power. If hitting something with such a move: changes their ability to Teaching Tech.",
	},
	scrappyarmor: {
		onModifyMovePriority: -5,
		onModifyMove(move) {
			if (!move.ignoreImmunity) move.ignoreImmunity = {};
			if (move.ignoreImmunity !== true) {
				move.ignoreImmunity['Fighting'] = true;
				move.ignoreImmunity['Normal'] = true;
			}
		},
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate' || effect.id === 'scarilyadorable') {
				delete boost.atk;
				this.add('-immune', target, '[from] ability: Scrappy Armor');
			}
			if (effect.id === 'peckingorder') {
				delete boost.def;
				this.add('-immune', target, '[from] ability: Scrappy Armor');
			}
			if (effect.id === 'debilitate') {
				delete boost.spa;
				this.add('-immune', target, '[from] ability: Scrappy Armor');
			}
			if (effect.id === 'sinkorswim' || effect.id === 'scarilyadorable') {
				delete boost.spe;
				this.add('-immune', target, '[from] ability: Scrappy Armor');
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (move.category === 'Physical') {
				this.boost({def: -1, spe: 2}, target, target);
			}
		},
		name: "Scrappy Armor",
		shortDesc: "Scrappy + Weak Armor",
	},
	olfactoryarmor: {
		onFoeTrapPokemon(pokemon) {
			if (pokemon.hasType('Steel') && this.isAdjacent(pokemon, this.effectData.target)) {
				pokemon.tryTrap(true);
			}
		},
		onFoeMaybeTrapPokemon(pokemon, source) {
			if (!source) source = this.effectData.target;
			if (!source || !this.isAdjacent(pokemon, source)) return;
			if (!pokemon.knownType || pokemon.hasType('Steel')) {
				pokemon.maybeTrapped = true;
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (target.getMoveHitData(move).typeMod > 0) {
				this.debug('Prism Armor neutralize');
				return this.chainModify(0.75);
			}
		},
		onSourceModifyAtkPriority: 5,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Steel') {
				return this.chainModify(0.75);
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Steel') {
				return this.chainModify(0.75);
			}
		},
		name: "Olfactory Armor",
		shortDesc: "This Pokemon prevents adjacent Steel-type foes from choosing to switch and takes 3/4 damage from Super Effective and Steel-type attacks.",
	},
	gutsyjaw: {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1.5);
			}
		},
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['bite']) {
				return this.chainModify(1.5);
			}
		},
		name: "Gutsy Jaw",
		shortDesc: "Guts + Strong Jaw",
	},
	finalargument: {
		onStart(source) {
			this.field.setTerrain('psychicterrain');
		},
		onSwitchOut(source) {
			this.field.setTerrain('psychicterrain');
		},
		name: "Final Argument",
		shortDesc: "Summons Psychic Terrain when switched in or out.",
	},
	mosscoat: {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Grass') {
				this.debug('Moss Coat boost');
				return this.chainModify(1.3);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Grass') {
				this.debug('Moss Coat boost');
				return this.chainModify(1.3);
			}
		},
		onSourceBasePowerPriority: 18,
		onSourceBasePower(basePower, attacker, defender, move) {
			if (move.id === 'earthquake' || move.id === 'magnitude' || move.id === 'bulldoze') {
				return this.chainModify(0.5);
			}
		},
		onResidualOrder: 5,
		onResidualSubOrder: 2,
		onResidual(pokemon) {
			if (this.field.isTerrain('grassyterrain')) return;
			this.heal(pokemon.maxhp / 16);
		},
		onTerrain(pokemon) {
			if (!this.field.isTerrain('grassyterrain')) return;
			this.heal(pokemon.maxhp / 16);
		},
		name: "Moss Coat",
		shortDesc: "This Pokemon is considered to be under the effects of Grassy Terrain.",
	},
	toxicplay: {
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Toxic Play');
		},
		onModifyMove(move) {
			move.ignoreAbility = true;
		},
		name: "Toxic Play",
		shortDesc: "Mold Breaker + Corrosion.",
	},
	covertops: {
		onAfterEachBoost(boost, target, source, effect) {
			if (!source || target.side === source.side) {
				if (effect.id === 'stickyweb') {
					this.hint("Court Change Sticky Web counts as lowering your own Speed, and Covert Ops only affects stats lowered by foes.", true, source.side);
				}
				return;
			}
			let statsLowered = false;
			let i: BoostName;
			for (i in boost) {
				if (boost[i]! < 0) {
					statsLowered = true;
				}
			}
			if (statsLowered) {
				this.add('-ability', target, 'Covert Ops');
				this.boost({spa: 2}, target, target, null, true);
			}
		},
		onModifyMove(move) {
			move.infiltrates = true;
		},
		name: "Covert Ops",
		shortDesc: "Infiltrator + Competitive.",
	},
	deluge: {
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Water') {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add('-immune', target, '[from] ability: Deluge');
				}
				return null;
			}
		},
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Water') {
				return this.chainModify(1.3);
			}
		},
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Water') {
				return this.chainModify(1.3);
			}
		},
		name: "Deluge",
		shortDesc: "This Pokemon heals 1/4 of its max HP when hit by Water moves; Water immunity. This Pokemon's Water moves have 1.3x power.",
	},
	contraryboost: {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				let success = false;
				let i: BoostName;
				for (i in source.boosts) {
					if (source.boosts[i] === 0) continue;
					source.boosts[i] = -source.boosts[i];
					success = true;
				}
				if (!success) return false;
				this.add('-invertboost', source, '[from] ability: Contrary Boost');
			}
		},
		name: "Contrary Boost",
		shortDesc: "Reverses stat changes after attacking and KOing a Pokemon.",
	},
	itemboost: {
		onAfterUseItem(item, pokemon) {
			if (pokemon !== this.effectData.target) return;
			pokemon.addVolatile('itemboost');
		},
		onTakeItem(item, pokemon) {
			pokemon.addVolatile('itemboost');
		},
		onEnd(pokemon) {
			pokemon.removeVolatile('itemboost');
		},
		condition: {
			onModifySpe(spe, pokemon) {
				if (!pokemon.item) {
					return this.chainModify(2);
				}
			},
		},
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				let statName = 'atk';
				let bestStat = 0;
				let s: StatNameExceptHP;
				for (s in source.storedStats) {
					if (source.storedStats[s] > bestStat) {
						statName = s;
						bestStat = source.storedStats[s];
					}
				}
				this.boost({[statName]: length}, source);
			}
		},
		name: "Item Boost",
		shortDesc: "Unburden + Beast Boost.",
	},
    ultrascout: {
        onStart(pokemon) {
            let activated = false;
            for (const target of pokemon.side.foe.active) {
                if (!target || target.fainted) continue;
                if (!activated) this.add('-ability', pokemon, 'Ultra Scout');
                activated = true;
                let statName = 'atk';
                let bestStat = 0;
                let s: StatNameExceptHP;
                for (s in target.storedStats) {
                    if (target.storedStats[s] > bestStat) {
                        statName = s;
                        bestStat = target.storedStats[s];
                    }
                }
                if (statName === 'atk') this.add('-message', `${(target.illusion ? target.illusion.name : target.name)} is most proficient in Attack!`);
                if (statName === 'def') this.add('-message', `${(target.illusion ? target.illusion.name : target.name)} is most proficient in Defense!`);
                if (statName === 'spa') this.add('-message', `${(target.illusion ? target.illusion.name : target.name)} is most proficient in Special Attack!`);
                if (statName === 'spd') this.add('-message', `${(target.illusion ? target.illusion.name : target.name)} is most proficient in Special Defense!`);
                if (statName === 'spe') this.add('-message', `${(target.illusion ? target.illusion.name : target.name)} is most proficient in Speed!`);
            }
        },
        name: "Ultra Scout",
        rating: 1.5,
		  shortDesc: "On switch-in, this Pokemon identifies the foe's highest non-HP stat",
    },
	scarilyadorable: {
		onStart(pokemon) {
			let activated = false;
			for (const target of pokemon.side.foe.active) {
				if (!target || !this.isAdjacent(target, pokemon)) continue;
				if (!activated) {
					this.add('-ability', pokemon, 'Scarily Adorable', 'boost');
					activated = true;
				}
				if (target.volatiles['substitute']) {
					this.add('-immune', target);
				} else {
					this.boost({atk: -1, spe: -1}, target, pokemon, null, true);
				}
			}
		},
		name: "Scarily Adorable",
		shortDesc: "On switch-in, this Pokemon lowers the Attack and Speed of adjacent opponents by 1 stage.",
	},
	solarboiler: {
		onTryHit(target, source, move) {
			if (target !== source && (move.type === 'Water' || move.type === 'Fire')) {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add('-immune', target, '[from] ability: Solar Boiler');
				}
				return null;
			}
		},
		onWeather(target, source, effect) {
			if (target.hasItem('utilityumbrella')) return;
			if (effect.id === 'raindance' || effect.id === 'primordialsea') {
				this.heal(target.baseMaxhp / 8);
			}
		},
		onModifySpe(spe, pokemon) {
			if (['sunnyday', 'desolateland'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(4);
			}
		},
		name: "Solar Boiler",
		shortDesc: "immune to Water and Fire-type attacks, heals 25% when hit by one; Heals 12.5% per turn in Rain; Has 4x Spe in Sun.",
	},
	voltophyll: {
		onTryHit(target, source, move) {
			if (target !== source && (move.type === 'Electric' || move.type === 'Fire')) {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add('-immune', target, '[from] ability: Voltophyll');
				}
				return null;
			}
		},
		onModifySpe(spe, pokemon) {
			if (['sunnyday', 'desolateland'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(2);
			}
		},
		name: "Voltophyll",
		shortDesc: "2x Speed in Sun; Heals 25% when hit by a Fire or Electric move; Fire/Electric immunity",
	},
	weatherpower: {
		onModifySpAPriority: 5,
		onModifySpA(spa, pokemon) {
			if (['sunnyday', 'desolateland', 'raindance', 'primordialsea', 'hail', 'sandstorm', 'deltastream'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(1.5);
			}
		},
		onWeather(target, source, effect) {
			if (target.hasItem('utilityumbrella')) return;
			if (effect.id === 'sunnyday' || effect.id === 'desolateland' || effect.id === 'raindance' || effect.id === 'primordialsea' || effect.id === 'hail' || effect.id === 'sandstorm' || effect.id === 'deltastream') {
				this.damage(target.baseMaxhp / 8, target, target);
			}
		},
		name: "Weather Power",
		shortDesc: "1.5x SpA while under any weather. User loses 12.5% of its HP in any weather.",
	},
	plotarmor: {
        onBasePowerPriority: 23,
        onBasePower(basePower, attacker, defender, move) {
            if (move.recoil || move.hasCrashDamage) {
                this.debug('Plot Armor boost');
                return this.chainModify([0x1333, 0x1000]);
            }
        },
        onDamagePriority: -100,
        onDamage(damage, target, source, effect) {
            if (damage >= target.hp && effect && (effect.id === 'recoil' || ((effect.id === 'jumpkick' || effect.id === 'highjumpkick') && source === target))) {
                this.add('-ability', target, 'Plot Armor');
                return target.hp - 1;
            }
        },
		name: "Plot Armor",
		shortDesc: "Reckless + If this Pokemon would faint due to recoil or crash damage, it will instead survive with 1 HP.",
	},
	reversegear: {
		name: "Reverse Gear",
		onBoost(boost) {
      		 boost.spe *= -1;
      },
		shortDesc: "Stat boosts to the Speed stat are inversed.",
	},
	innerfocus: {
		onTryAddVolatile(status, pokemon) {
			if (status.id === 'flinch') return null;
		},
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate' || effect.id === 'scarilyadorable') {
				delete boost.atk;
				this.add('-immune', target, '[from] ability: Inner Focus');
			}
			if (effect.id === 'peckingorder') {
				delete boost.def;
				this.add('-immune', target, '[from] ability: Inner Focus');
			}
			if (effect.id === 'debilitate') {
				delete boost.spa;
				this.add('-immune', target, '[from] ability: Inner Focus');
			}
			if (effect.id === 'sinkorswim' || effect.id === 'scarilyadorable') {
				delete boost.spe;
				this.add('-immune', target, '[from] ability: Inner Focus');
			}
		},
		name: "Inner Focus",
		rating: 1.5,
		num: 39,
	},
	fairygust: {
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Normal' && !noModifyType.includes(move.id) && !(move.isZ && move.category !== 'Status')) {
				move.type = 'Fairy';
				move.pixilateBoosted = true;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.pixilateBoosted) return this.chainModify([0x1333, 0x1000]);
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.type === 'Flying' && pokemon.hp === pokemon.maxhp) return priority + 1;
		},
		name: "Fairy Gust",
		shortDesc: "Pixilate + Gale Wings.",
	},
	leafstream: {
		onSetStatus(status, target, source, effect) {
			if (['sunnyday', 'desolateland'].includes(target.effectiveWeather())) {
				if ((effect as Move)?.status) {
					this.add('-immune', target, '[from] ability: Leaf Guard');
				}
				return false;
			}
		},
		onTryAddVolatile(status, target) {
			if (status.id === 'yawn' && ['sunnyday', 'desolateland'].includes(target.effectiveWeather())) {
				this.add('-immune', target, '[from] ability: Leaf Guard');
				return null;
			}
		},
		onStart(source) {
			for (const action of this.queue) {
				if (action.choice === 'runPrimal' && action.pokemon === source && source.species.id === 'groudon') return;
				if (action.choice !== 'runSwitch' && action.choice !== 'runPrimal') break;
			}
			this.field.setWeather('sunnyday');
		},
		name: "Leaf Stream",
		shortDesc: "Leaf Guard + Summons Sunny Day on switch-in.",
	},
	jawofthelaw: {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['bite']) {
				return this.chainModify(1.5);
			}
		},
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender) {
			if (!defender.activeTurns) {
				this.debug('Jaw of the Law boost');
				return this.chainModify(2);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender) {
			if (!defender.activeTurns) {
				this.debug('Jaw of the Law boost');
				return this.chainModify(2);
			}
		},
		name: "Jaw of the Law",
		shortDesc: "Strong Jaw + Stakeout.",
	},
	mystic: {
		onStart(source) {
			this.field.setTerrain('mistyterrain');
		},
		// The rest is implemented in moves.ts
		name: "Mystic",
		shortDesc: "Misty Surge + This Pokemon's moves ignore the effects of Misty Terrain.",
	},
	peckingorder: {
		name: "Pecking Order",
		shortDesc: "On switch-in, this Pokemon lowers the Defense of adjacent opponents by 1 stage.",
		onStart(pokemon) {
			let activated = false;
			for (const target of pokemon.side.foe.active) {
				if (!target || !this.isAdjacent(target, pokemon)) continue;
				if (!activated) {
					this.add('-ability', pokemon, 'Pecking Order', 'boost');
					activated = true;
				}
				if (target.volatiles['substitute']) {
					this.add('-immune', target);
				} else {
					this.boost({def: -1}, target, pokemon, null, true);
				}
			}
		},
	},
	marblegarden: {
		onDamage(damage, target, source, effect) {
			if (effect.id === 'recoil') {
				if (!this.activeMove) throw new Error("Battle.activeMove is null");
				if (this.activeMove.id !== 'struggle') return null;
			}
		},
		onAllyBoost(boost, target, source, effect) {
			if ((source && target === source)) return;
			let showMsg = false;
			let i: BoostName;
			for (i in boost) {
				if (boost[i]! < 0) {
					delete boost[i];
					showMsg = true;
				}
			}
			if (showMsg && !(effect as ActiveMove).secondaries) {
				const effectHolder = this.effectData.target;
				this.add('-block', target, 'ability: Marble Garden', '[of] ' + effectHolder);
			}
		},
		onAllySetStatus(status, target, source, effect) {
			if (source && target !== source && effect && effect.id !== 'yawn') {
				this.debug('interrupting setStatus with Marble Garden');
				if (effect.id === 'synchronize' || (effect.effectType === 'Move' && !effect.secondaries)) {
					const effectHolder = this.effectData.target;
					this.add('-block', target, 'ability: Marble Garden', '[of] ' + effectHolder);
				}
				return null;
			}
		},
		onAllyTryAddVolatile(status, target) {
			if (status.id === 'yawn') {
				this.debug('Marble Garden blocking yawn');
				const effectHolder = this.effectData.target;
				this.add('-block', target, 'ability: Marble Garden', '[of] ' + effectHolder);
				return null;
			}
		},
		name: "Marble Garden",
		shortDesc: "Protects the user from Recoil, and status infliction and stat reduction from other Pokémon.",
	},
	devilsadvocate: {
		onPreStart(pokemon) {
			this.add('-ability', pokemon, 'Devil\'s Advocate', pokemon.side.foe);
		},
		onBoost(boost, target, source, effect) {
			if (effect && effect.id === 'zpower') return;
			let i: BoostName;
			for (i in boost) {
				boost[i]! *= -1;
			}
		},
		onFoeTryEatItem: false,
		name: "Devil's Advocate",
		shortDesc: "Unnerve + Contrary",
	},
	snowglobe: {
		onStart(source) {
			this.field.setWeather('hail');
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (this.field.isWeather('hail')) {
				if (move.type === 'Rock' || move.type === 'Ground' || move.type === 'Steel') {
					this.debug('Snow Globe boost');
					return this.chainModify([0x14CD, 0x1000]);
				}
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'hail') return false;
		},
		name: "Snow Globe",
		shortDesc: "Summons Hail on switch-in. Steel, Ground, and Rock moves deal 1.3x damage in Hail; Hail immunity.",
	},
	bugscicle: {
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Bug' && !noModifyType.includes(move.id) && !(move.isZ && move.category !== 'Status')) {
				move.type = 'Ice';
				move.refrigerateBoosted = true;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.refrigerateBoosted) return this.chainModify([0x1333, 0x1000]);
		},
		name: "Bugscicle",
		shortDesc: "This Pokémon's Bug-Type moves become Ice-Type and deal 1.2x damage.",
	},
	magicfist: {
		onBasePowerPriority: 23,
		onBasePower(basePower, attacker, defender, move) {
			if (!attacker.item) {
				this.debug('Magic Fist boost');
				return this.chainModify([0x1333, 0x1000]);
			}
		},
		name: "Magic Fist",
		shortDesc: "If this Pokemon has no item, its attacks have 1.2x power.",
	},
	sandbubbler: {
		onStart(source) {
			this.field.setWeather('sandstorm');
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['punch']) {
				this.debug('Sand Bubbler boost');
				return this.chainModify([0x1333, 0x1000]);
			}
		},
		name: "Sand Bubbler",
		shortDesc: "Sand Stream + Iron Fist.",
	},
	bombardier: {
		onBasePowerPriority: 19,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['bullet']) {
				return this.chainModify(1.5);
			}
		},
		name: "Bombardier",
		shortDesc: "Bullet and Bomb moves have 1.5x power.",
	},
	asonekecleon: {
		onPreStart(pokemon) {
			this.add('-ability', pokemon, 'As One');
			this.add('-ability', pokemon, 'Unnerve', pokemon.side.foe);
		},
		onFoeTryEatItem: false,
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.boost({spa: length}, source, source, this.dex.getAbility('grimneigh'));
			}
		},
		onAfterMoveSecondary(target, source, move) {
			if (!target.hp) return;
			const type = move.type;
			if (
				target.isActive && move.effectType === 'Move' && move.category !== 'Status' &&
				type !== '???' && !target.hasType(type)
			) {
				if (!target.setType(type)) return false;
				this.add('-start', target, 'typechange', type, '[from] ability: Color Change');

				if (target.side.active.length === 2 && target.position === 1) {
					// Curse Glitch
					const action = this.queue.willMove(target);
					if (action && action.move.id === 'curse') {
						action.targetLoc = -1;
					}
				}
			}
		},
		name: "As One (Kecleon)",
		shortDesc: "As One (Spectrier) + Color Change.",
	},
	heavyarmor: {
		onBoost(boost, target, source, effect) {
			if (source && target === source) return;
			let showMsg = false;
			let i: BoostName;
			for (i in boost) {
				if (boost[i]! < 0) {
					delete boost[i];
					showMsg = true;
				}
			}
			if (showMsg && !(effect as ActiveMove).secondaries && effect.id !== 'octolock') {
				this.add("-fail", target, "unboost", "[from] ability: Heavy Armor", "[of] " + target);
			}
		},
		onCriticalHit: false,
		name: "Heavy Armor",
		shortDesc: "Prevents other Pokemon from lowering this Pokemon's stat stages. This Pokemon cannot be struck by a critical hit.",
	},
	magicwand: {
		onModifyMove(move) {
			delete move.flags['contact'];
		},
		onDamage(damage, target, source, effect) {
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
		name: "Magic Wand",
		shortDesc: "Long Reach + Magic Guard",
	},
	sportsshowtime: {
		onPrepareHit(source, target, move) {
			if (move.hasBounced) return;
			const type = move.type;
			if (type && type !== '???' && source.getTypes().join() !== type) {
				if (!source.setType(type)) return;
				this.add('-start', source, 'typechange', type, '[from] ability: Sports Showtime');
				this.heal(source.baseMaxhp / 16);
			}
		},
		name: "Sports Showtime",
		shortDesc: "Changes to the type of its used move and heals 1/16 of its max HP before dealing damage",
	},
	firestarter: {
		onDamagingHit(damage, target, source, move) {
			if (move.flags['contact']) {
				if (this.randomChance(3, 10)) {
					source.trySetStatus('brn', target);
				}
			}
		},
		onModifyMove(move) {
			if (!move || !move.flags['contact'] || move.target === 'self') return;
			if (!move.secondaries) {
				move.secondaries = [];
			}
			move.secondaries.push({
				chance: 30,
				status: 'brn',
				ability: this.dex.getAbility('firestarter'),
			});
		},
		name: "Fire Starter",
		shortDesc: "30% chance to burn opponent when using a contact move or when the opponent makes contact with this Pokemon",
	},
	"parasomnia": { 
		shortDesc: "Upon a KO or falling asleep, highest non-HP stat is raised by 1 stage.",
		id: "parasomnia",
		name: "Parasomnia",
		onSourceFaint(target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				let statName = 'atk';
				let bestStat = 0;
				/** @type {StatNameExceptHP} */
				let s;
				for (s in source.storedStats) {
					if (source.storedStats[s] > bestStat) {
						statName = s;
						bestStat = source.storedStats[s];
					}
				}
				this.boost({[statName]: 1}, source);
			}
		},
		onSetStatus(status, target, source, effect) { 
			let statName = 'atk';
			let bestStat = 0;
			/** @type {StatNameExceptHP} */
			let s;
			for (s in this.effectData.target.storedStats) {
				if (this.effectData.target.storedStats[s] > bestStat) {
					statName = s;
					bestStat = this.effectData.target.storedStats[s];
				}
			}
			if (status.id === 'slp') {
				this.boost({[statName]: 1}, this.effectData.target);
			}
		},
	}, 
	willfulcharge: {
		 onTryHit(target, source, move) {
            if (target !== source && move.type === 'Electric') {
                if (!this.heal(target.baseMaxhp / 4)) {
                    this.add('-immune', target, '[from] ability: Willful Charge');
                }
                return null;
            }
        },
        onModifyMove(move) {
            if (move.type === 'Electric') {
                move.ignoreDefensive = true;
                move.ignoreEvasion = true;
            }
        },
		name: "Willful Charge",
		shortDesc: "Ignores opponent’s stat changes when doing damage with Electric-type moves and recovers 1/4 max HP when hit by an electric type move; Electric immunity.",
	},
	sheerheart: {
		onBasePowerPriority: 21,
		onBasePower(basePower, pokemon, target, move) {
			if (move.category === 'Special') return this.chainModify([0x14CD, 0x1000]);
		},
		onBoost(boost, target, source, effect) {
			if (boost.spa && boost.spa < 0 || boost.spa > 0) {
				delete boost.spa;
				if (!(effect as ActiveMove).secondaries) {
					this.add("-fail", target, "unboost", "Special Attack", "[from] ability: Sheer Heart", "[of] " + target);
				}
			}
		},
		name: "Sheer Heart",
		shortDesc: "Special attacks have 1.3x power; stat changes to the Special Attack stat have no effect.",
	},
	berrynice: {
		onModifySpe(spe, pokemon) {
			if (['sunnyday', 'desolateland'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(2);
			}
		},
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual(pokemon) {
			if (this.field.isWeather(['sunnyday', 'desolateland']) || this.randomChance(1, 2)) {
				if (pokemon.hp && !pokemon.item && this.dex.getItem(pokemon.lastItem).isBerry) {
					pokemon.setItem(pokemon.lastItem);
					pokemon.lastItem = '';
					this.add('-item', pokemon, pokemon.getItem(), '[from] ability: Berry Nice');
				}
			}
		},
		onTryHeal(damage, target, source, effect) {
			if (!effect) return;
			if (effect.id === 'berryjuice' || effect.id === 'leftovers') {
				this.add('-activate', target, 'ability: Ripen');
			}
			if ((effect as Item).isBerry) return this.chainModify(2);
		},
		onBoost(boost, target, source, effect) {
			if (effect && (effect as Item).isBerry) {
				let b: BoostName;
				for (b in boost) {
					boost[b]! *= 2;
				}
			}
		},
		onSourceModifyDamagePriority: -1,
		onSourceModifyDamage(damage, source, target, move) {
			if (target.abilityData.berryWeaken) {
				return this.chainModify(0.5);
			}
		},
		onTryEatItemPriority: -1,
		onTryEatItem(item, pokemon) {
			this.add('-activate', pokemon, 'ability: Berry Nice');
		},
		onEatItem(item, pokemon) {
			const weakenBerries = [
				'Babiri Berry', 'Charti Berry', 'Chilan Berry', 'Chople Berry', 'Coba Berry', 'Colbur Berry', 'Haban Berry', 'Kasib Berry', 'Kebia Berry', 'Occa Berry', 'Passho Berry', 'Payapa Berry', 'Rindo Berry', 'Roseli Berry', 'Shuca Berry', 'Tanga Berry', 'Wacan Berry', 'Yache Berry',
			];
			// Record if the pokemon ate a berry to resist the attack
			pokemon.abilityData.berryWeaken = weakenBerries.includes(item.name);
		},
		name: "Berry Nice",
		shortDesc: "Chlorophyll + Harvest + Berries eaten by this Pokemon have their effect doubled.",
	},
	swiftretreat: {
		onEmergencyExit(target) {
			if (!this.canSwitch(target.side) || target.forceSwitchFlag || target.switchFlag) return;
			for (const side of this.sides) {
				for (const active of side.active) {
					active.switchFlag = false;
				}
			}
			target.switchFlag = true;
			this.add('-activate', target, 'ability: Swift Retreat');
		},
		onModifySpe(spe, pokemon) {
			if (['raindance', 'primordialsea'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(2);
			}
		},
		name: "Swift Retreat",
		shortDesc: "Emergency Exit + Swift Swim.",
	},	
	magneticwaves: {
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Normal' && !noModifyType.includes(move.id) && !(move.isZ && move.category !== 'Status')) {
				move.type = 'Electric';
				move.galvanizeBoosted = true;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.galvanizeBoosted) return this.chainModify([0x1333, 0x1000]);
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Ground') {
				this.add('-immune', target, '[from] ability: Magnetic Waves');
				return null;
			}
		},
		name: "Magnetic Waves",
		shortDesc: "Galvanize + Levitate.",
	},	
	fridge: {
		onTryHeal(damage, target, source, effect) {
			if (!effect) return;
			if (effect.id === 'berryjuice' || effect.id === 'leftovers') {
				this.add('-activate', target, 'ability: Fridge');
			}
			if ((effect as Item).isBerry) return this.chainModify(2);
		},
		onBoost(boost, target, source, effect) {
			if (effect && (effect as Item).isBerry) {
				let b: BoostName;
				for (b in boost) {
					boost[b]! *= 2;
				}
			}
		},
		onSourceModifyDamagePriority: -1,
		onSourceModifyDamage(damage, source, target, move) {
			if (target.abilityData.berryWeaken) {
				return this.chainModify(0.5);
			}
		},
		onTryEatItemPriority: -1,
		onTryEatItem(item, pokemon) {
			this.add('-activate', pokemon, 'ability: Fridge');
		},
		onEatItem(item, pokemon) {
			const weakenBerries = [
				'Babiri Berry', 'Charti Berry', 'Chilan Berry', 'Chople Berry', 'Coba Berry', 'Colbur Berry', 'Haban Berry', 'Kasib Berry', 'Kebia Berry', 'Occa Berry', 'Passho Berry', 'Payapa Berry', 'Rindo Berry', 'Roseli Berry', 'Shuca Berry', 'Tanga Berry', 'Wacan Berry', 'Yache Berry',
			];
			// Record if the pokemon ate a berry to resist the attack
			pokemon.abilityData.berryWeaken = weakenBerries.includes(item.name);
		},
		onSourceBasePowerPriority: 18,
		onSourceBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Fire') {
				return this.chainModify(0.5);
			}
		},
		onDamage(damage, target, source, effect) {
			if (effect && effect.id === 'brn') {
				return damage / 2;
			}
		},
		name: "Fridge",
		shortDesc: "Ripen + Heatproof.",
	},	
	monarchyenforcement: {
		onModifyMove(move, pokemon) {
			if (move.secondaries) {
				delete move.secondaries;
				// Technically not a secondary effect, but it is negated
				delete move.self;
				if (move.id === 'clangoroussoulblaze') delete move.selfBoost;
				// Actual negation of `AfterMoveSecondary` effects implemented in scripts.js
				move.hasSheerForce = true;
			}
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, pokemon, target, move) {
			if (move.hasSheerForce) return this.chainModify([0x14CD, 0x1000]);
		},
		onFoeTryMove(target, source, move) {
			const targetAllExceptions = ['perishsong', 'flowershield', 'rototiller'];
			if (move.target === 'foeSide' || (move.target === 'all' && !targetAllExceptions.includes(move.id))) {
				return;
			}

			const dazzlingHolder = this.effectData.target;
			if ((source.side === dazzlingHolder.side || move.target === 'all') && move.priority > 0.1) {
				this.attrLastMove('[still]');
				this.add('cant', dazzlingHolder, 'ability: Monarchy Enforcement', move, '[of] ' + target);
				return false;
			}
		},
		name: "Monarchy Enforcement",
		shortDesc: "Sheer Force + Queenly Majesty.",
	},	
	yakultian: {
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.boost({atk: length}, source);
			}
		},
		onStart(source) {
			this.field.setWeather('hail');
		},
		name: "Yakultian",
		shortDesc: "Chilling Neigh + Snow Warning.",
	},	
	acceleration: {
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual(pokemon) {
			if (pokemon.activeTurns) {
				this.boost({spe: 1});
			}
		},
		onAfterEachBoost(boost, target, source, effect) {
			if (!source || target.side === source.side) {
				if (effect.id === 'stickyweb') {
					this.hint("Court Change Sticky Web counts as lowering your own Speed, and Acceleration only affects stats lowered by foes.", true, source.side);
				}
				return;
			}
			let statsLowered = false;
			let i: BoostName;
			for (i in boost) {
				if (boost[i]! < 0) {
					statsLowered = true;
				}
			}
			if (statsLowered) {
				this.add('-ability', target, 'Acceleration');
				this.boost({spe: 2}, target, target, null, true);
			}
		},
		name: "Acceleration",
		shortDesc: "This Pokemon's Speed goes up by 1 stage at the end of every turn. +2 Speed when a stat is lowered.",
	},	
	extremophile: {
		onModifySpe(spe, pokemon) {
			if (['sunnyday', 'desolateland', 'hail'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(2);
			}
		},
		name: "Extremophile",
		shortDesc: "Slush Rush + Chlorophyll.",
	},	
	hivemind: {
		onBoost(boost, target, source, effect) {
			if (source && target === source) return;
			let showMsg = false;
			let i: BoostName;
			for (i in boost) {
				if (boost[i]! < 0) {
					delete boost[i];
					showMsg = true;
				}
			}
			if (showMsg && !(effect as ActiveMove).secondaries && effect.id !== 'octolock') {
				this.add("-fail", target, "unboost", "[from] ability: Hivemind", "[of] " + target);
			}
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Bug') {
				this.add('-immune', target, '[from] ability: Hivemind');
				return null;
			}
		},
		name: "Hivemind",
		shortDesc: "This Pokemon is immune to having its stats lowered and Bug-type moves.",
	},	
	anatidaephobia: {
		onModifyMovePriority: -5,
		onModifyMove(move) {
			if (!move.ignoreImmunity) move.ignoreImmunity = {};
			if (move.ignoreImmunity !== true) {
				move.ignoreImmunity['Fighting'] = true;
				move.ignoreImmunity['Normal'] = true;
			}
			if (!move || !move.type === 'Normal' && !move.type === 'Fighting' || move.target === 'self') return;
			if (!move.secondaries) {
				move.secondaries = [];
			}
			move.secondaries.push({
				chance: 100,
				volatileStatus: 'perishsong',
				ability: this.dex.getAbility('anatidaephobia'),
			});
		},
		onBoost(boost, target, source, effect) {
			if (effect.id === 'intimidate' || effect.id === 'scarilyadorable') {
				delete boost.atk;
				this.add('-immune', target, '[from] ability: Anatidaephobia');
			}
			if (effect.id === 'peckingorder') {
				delete boost.def;
				this.add('-immune', target, '[from] ability: Anatidaephobia');
			}
			if (effect.id === 'debilitate') {
				delete boost.spa;
				this.add('-immune', target, '[from] ability: Anatidaephobia');
			}
			if (effect.id === 'sinkorswim' || effect.id === 'scarilyadorable') {
				delete boost.spe;
				this.add('-immune', target, '[from] ability: Anatidaephobia');
			}
		},
		name: "Anatidaephobia",
		shortDesc: "This Pokemon's Normal and Fighting-type moves can hit Ghost-types and inflict the target with the Perish Song effect.",
	},	
	permafrost: {
		onSourceModifyDamage(damage, source, target, move) {
			if (target.getMoveHitData(move).typeMod > 0) {
				this.debug('Permafrost neutralize');
				return this.chainModify(0.75);
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (target.getMoveHitData(move).typeMod > 0) {
				target.heal(target.baseMaxhp / 16);
				this.add('-heal', target, target.getHealth, '[from] ability: Permafrost');
			}
		},
		name: "Permafrost",
		shortDesc: "When hit by a super effective move, that move deals 3/4 damage and this Pokemon gets healed by 1/16 of its max HP.",
	},	
	grassystream: {
		onStart(source) {
			this.field.setTerrain('grassyterrain');
		},
		onModifyDefPriority: 6,
		onModifyDef(pokemon) {
			if (this.field.isWeather('sandstorm')) return this.chainModify(1.5);
		},
		name: "Grassy Stream",
		shortDesc: "Sets Grassy Terrain upon switch-in. 1.5x Def under Sandstorm.",
	},	
/*
	electrolytes: {
		onResidualOrder: 5,
		onResidualSubOrder: 4,
		onResidual(pokemon, length) {
			if (pokemon.status) {
				this.debug('electrolytes');
				this.add('-activate', pokemon, 'ability: Electrolytes');
				pokemon.cureStatus();
				let statName = 'atk';
				let bestStat = 0;
				let s: StatNameExceptHP;
				for (s in pokemon.storedStats) {
					if (pokemon.storedStats[s] > bestStat) {
						statName = s;
						bestStat = pokemon.storedStats[s];
					}
				}
				this.boost({[statName]: length}, pokemon);
			}
		},
		name: "Electrolytes",
		shortDesc: "When this Pokemon is statused by an opponent, the status is cured at the end of the turn and this Pokemon gains +1 to their highest non-HP stat.",
	},	
*/
    electrolytes: {
        onResidualOrder: 5,
        onResidualSubOrder: 4,
        onResidual(pokemon) {
            if (pokemon.hp && pokemon.status) {
                if (!pokemon.statusData.source || !pokemon.statusData.source.side || pokemon.statusData.source.side === pokemon.side) return;
                this.debug('Electrolytes');
                let statName = 'atk';
                let bestStat = 0;
                let s: StatNameExceptHP;
                for (s in pokemon.storedStats) {
                    if (pokemon.storedStats[s] > bestStat) {
                        statName = s;
                        bestStat = pokemon.storedStats[s];
                    }
                }
                this.boost({[statName]: 1}, pokemon);
                pokemon.cureStatus();
            }
        },
        name: "Electrolytes",
        rating: 4,
		  shortDesc: "When this Pokemon is statused by an opponent, the status is cured at the end of the turn and this Pokemon gains +1 to their highest non-HP stat.",
    },
	workability: {
		onModifyMove(move) {
			move.stab = 2;
		},
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Steel') {
				this.debug('Workability boost');
				return this.chainModify(2);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Steel') {
				this.debug('Workability boost');
				return this.chainModify(2);
			}
		},
		name: "Workability",
		shortDesc: "This Pokemon's STAB boost is 2x instead of 1.5x. Steel-type moves are considered STAB for this Pokemon",
	},	
	deusexmachina: {
		onStart(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== 'Wishirupti' || pokemon.level < 20 || pokemon.transformed) return;
			if (pokemon.hp > pokemon.maxhp / 4) {
				if (pokemon.species.id === 'wishirupti') {
					pokemon.formeChange('Wishirupti-School');
				}
			} else {
				if (pokemon.species.id === 'wishiruptischool') {
					pokemon.formeChange('Wishirupti');
					pokemon.setBoost({atk: 6});
					this.add('-setboost', pokemon, 'atk', 12, '[from] ability: Deus Ex Machina');
				}
			}
		},
		onResidualOrder: 27,
		onResidual(pokemon) {
			if (
				pokemon.baseSpecies.baseSpecies !== 'Wishirupti' || pokemon.level < 20 ||
				pokemon.transformed || !pokemon.hp
			) return;
			if (pokemon.hp > pokemon.maxhp / 4) {
				if (pokemon.species.id === 'wishirupti') {
					pokemon.formeChange('Wishirupti-School');
				}
			} else {
				if (pokemon.species.id === 'wishiruptischool') {
					pokemon.formeChange('Wishirupti');
					pokemon.setBoost({atk: 6});
					this.add('-setboost', pokemon, 'atk', 12, '[from] ability: Deus Ex Machina');
				}
			}
		},
		isPermanent: true,
		name: "Deus Ex Machina",
		shortDesc: "Schooling effects. When this Pokemon enters Solo form, it gains +12 Attack.",
	},
	neutralizinggas: {
		// Ability suppression implemented in sim/pokemon.ts:Pokemon#ignoringAbility
		// TODO Will abilities that already started start again? (Intimidate seems like a good test case)
		onPreStart(pokemon) {
			this.add('-ability', pokemon, 'Neutralizing Gas');
			pokemon.abilityData.ending = false;
			for (const target of this.getAllActive()) {
				if (target.illusion) {
					this.singleEvent('End', this.dex.getAbility('Illusion'), target.abilityData, target, pokemon, 'neutralizinggas');
				}
				if (target.volatiles['slowstart']) {
					delete target.volatiles['slowstart'];
					this.add('-end', target, 'Slow Start', '[silent]');
				}
			}
		},
		onSourceAfterFaint(length, target, source, effect) {
			if (source.species.baseSpecies !== 'Weezlord-Galar') return;
			if (effect && effect.effectType === 'Move') {
				let statName = 'atk';
				let bestStat = 0;
				let s: StatNameExceptHP;
				for (s in source.storedStats) {
					if (source.storedStats[s] > bestStat) {
						statName = s;
						bestStat = source.storedStats[s];
					}
				}
				this.boost({[statName]: length}, source);
			}
		},
		onEnd(source) {
			// FIXME this happens before the pokemon switches out, should be the opposite order.
			// Not an easy fix since we cant use a supported event. Would need some kind of special event that
			// gathers events to run after the switch and then runs them when the ability is no longer accessible.
			// (If your tackling this, do note extreme weathers have the same issue)

			// Mark this pokemon's ability as ending so Pokemon#ignoringAbility skips it
			source.abilityData.ending = true;
			for (const pokemon of this.getAllActive()) {
				if (pokemon !== source) {
					// Will be suppressed by Pokemon#ignoringAbility if needed
					this.singleEvent('Start', pokemon.getAbility(), pokemon.abilityData, pokemon);
				}
			}
		},
		name: "Neutralizing Gas",
		shortDesc: "While this Pokemon is active, Abilities have no effect. Weezlord: +1 to highest stat upon KO",
		rating: 5,
		num: 256,
	},
	undercut: {
		onBasePowerPriority: 30,
		onBasePower(basePower, attacker, defender, move) {
			this.chainModify(0.75);
			const basePowerAfterMultiplier = this.modify(basePower, this.event.modifier);
			this.debug('Base Power: ' + basePowerAfterMultiplier);
			if (basePowerAfterMultiplier <= 60) {
				this.debug('Technician boost');
				return this.chainModify(1.875);
			}
		},
		name: "Undercut",
		shortDesc: "This Pokemon's moves of 80 power or less have 1.40625x power, but its moves higher than 80 power have 0.75x power.",
	},	
	heatgenerator: {
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Fire' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Heat Generator');
				return this.chainModify(1.5);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Fire' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Heat Generator');
				return this.chainModify(1.5);
			}
		},
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
		},
		name: "Heat Generator",
		shortDesc: "Regenerator + Blaze",
	},	
	flamingskin: {
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Water') {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add('-immune', target, '[from] ability: Flaming Skin');
				}
				return null;
			}
		},
		onFoeBasePowerPriority: 17,
		onFoeBasePower(basePower, attacker, defender, move) {
			if (this.effectData.target !== defender) return;
			if (move.type === 'Fire') {
				return this.chainModify(1.25);
			}
		},
		onWeather(target, source, effect) {
			if (target.hasItem('utilityumbrella')) return;
			if (effect.id === 'raindance' || effect.id === 'primordialsea') {
				this.heal(target.baseMaxhp / 8);
			} else if (effect.id === 'sunnyday' || effect.id === 'desolateland') {
				this.damage(target.baseMaxhp / 8, target, target);
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (move.flags['contact']) {
				if (this.randomChance(3, 10)) {
					source.trySetStatus('brn', target);
				}
			}
		},
		name: "Flaming Skin",
		shortDesc: "Dry Skin + Flame Body",
	},	
	etativel: {
		onBoost(boost, target, source, effect) {
			if (effect && effect.id === 'zpower') return;
			let i: BoostName;
			for (i in boost) {
				boost[i]! *= -1;
			}
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Ground') {
				this.add('-immune', target, '[from] ability: Etativel');
				return null;
			}
		},
		name: "Etativel",
		shortDesc: "Contrary + Levitate",
	},	
	clutchfactor: {
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender, move) {
			if (move.category === 'Special' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Clutch Factor boost boost');
				return this.chainModify(1.5);
			}
		},
		name: "Clutch Factor",
		shortDesc: "Special Attacks are boosted by 1.5x at 1/3 HP or less.",
	},	
	stickysurge: {
		onTakeItem(item, pokemon, source) {
			if (this.suppressingAttackEvents(pokemon) || !pokemon.hp || pokemon.item === 'stickybarb') return;
			if (!this.activeMove) throw new Error("Battle.activeMove is null");
			if ((source && source !== pokemon) || this.activeMove.id === 'knockoff') {
				this.add('-activate', pokemon, 'ability: Sticky Surge');
				return false;
			}
		},
		onStart(source) {
			this.field.setTerrain('electricterrain');
		},
		name: "Sticky Surge",
		shortDesc: "Sticky Hold + Electric Surge.",
	},	
    selfsacrifice: {
        onFaint(pokemon) {
            pokemon.side.addSlotCondition(pokemon, 'selfsacrifice');
        },
        condition: {
            onStart(pokemon, source) {
                this.effectData.hp = source.maxhp / 4;
            },
            onSwap(target) {
                if (!target.fainted) {
                    const damage = this.heal(this.effectData.hp, target, target);
                    if (damage) this.add('-heal', target, target.getHealth, '[from] ability: Self Sacrifice', '[of] ' + this.effectData.source);
                    target.side.removeSlotCondition(target, 'selfsacrifice');
                }
            },
        },
      name: "Self Sacrifice",
		shortDesc: "When this Pokemon faints, the replacement is healed by 1/4 of this Pokemon's max HP",
    },
};
 
