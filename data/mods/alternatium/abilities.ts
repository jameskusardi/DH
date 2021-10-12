/*

Ratings and how they work:

-1: Detrimental
	  An ability that severely harms the user.
	ex. Defeatist, Slow Start

 0: Useless
	  An ability with no overall benefit in a singles battle.
	ex. Color Change, Plus

 1: Ineffective
	  An ability that has minimal effect or is only useful in niche situations.
	ex. Light Metal, Suction Cups

 2: Useful
	  An ability that can be generally useful.
	ex. Flame Body, Overcoat

 3: Effective
	  An ability with a strong effect on the user or foe.
	ex. Chlorophyll, Sturdy

 4: Very useful
	  One of the more popular abilities. It requires minimal support to be effective.
	ex. Adaptability, Magic Bounce

 5: Essential
	  The sort of ability that defines metagames.
	ex. Imposter, Shadow Tag

*/

export const Abilities: {[abilityid: string]: AbilityData} = {
	galewings: {
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.type === 'Flying' && pokemon.hp === pokemon.maxhp || pokemon.species.id === 'silvallyflying' && move.id === 'multiattack' && pokemon.hp === pokemon.maxhp) return priority + 1;
		},
		name: "Gale Wings",
		rating: 3,
		num: 177,
	},
	powerofalchemy: {
		onAnyFaint(target) {
			if (!this.effectData.target.hp) return;
			const ability = target.getAbility();
			const additionalBannedAbilities = [
				'noability', 'flowergift', 'forecast', 'hungerswitch', 'illusion', 'imposter', 'neutralizinggas', 'powerofalchemy', 'receiver', 'trace', 'wonderguard',
			];
			if (target.getAbility().isPermanent || additionalBannedAbilities.includes(target.ability)) return;
			this.add('-ability', this.effectData.target, ability, '[from] ability: Power of Alchemy', '[of] ' + target);
			this.effectData.target.setAbility(ability);
		},
		name: "Power of Alchemy",
		shortDesc: "This Pokémon copies the ability of the last fainted Pokémon.",
		rating: 0,
		num: 223,
	},
	quickdraw: {
		onModifyPriority(priority, source, move) {
			if (source.activeMoveActions < 1) {
				return priority + 1;
			}
			else if (source.activeMoveActions > 1) {
				return priority + 0;
			}
		},
		name: "Quick Draw",
		shortDesc: "User's moves have increased priority in the first turn but are weakend by 0.75x.",
		rating: 2.5,
		num: 259,
	},
	rkssystem: {
		onStart(pokemon) {
			if (pokemon.species.id === 'silvally') {
				this.add('-ability', pokemon, 'Adaptability', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('adaptability');
				pokemon.baseAbility = 'adaptability';
			}
			else if (pokemon.species.id === 'silvallybug') {
				this.add('-ability', pokemon, 'Tinted Lens', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('tintedlens');
				pokemon.baseAbility = 'tintedlens';
			}
			if (pokemon.species.id === 'silvallydark') {
				this.add('-ability', pokemon, 'Dark Aura', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('darkaura');
				pokemon.baseAbility = 'darkaura';
			}
			if (pokemon.species.id === 'silvallydragon') {
				this.add('-ability', pokemon, 'Multiscale', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('multiscale');
				pokemon.baseAbility = 'multiscale';
			}
			if (pokemon.species.id === 'silvallyelectric') {
				this.add('-ability', pokemon, 'Lightning Rod', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('lightningrod');
				pokemon.baseAbility = 'lightningrod';
			}
			if (pokemon.species.id === 'silvallyfairy') {
				this.add('-ability', pokemon, 'Misty Terrain', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('mistyterrain');
				pokemon.baseAbility = 'mistyterrain';
			}
			if (pokemon.species.id === 'silvallyfighting') {
				this.add('-ability', pokemon, 'Scrappy', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('scrappy');
				pokemon.baseAbility = 'scrappy';
			}
			if (pokemon.species.id === 'silvallyfire') {
				this.add('-ability', pokemon, 'Flash Fire', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('flashfire');
				pokemon.baseAbility = 'flashfire';
			}
			if (pokemon.species.id === 'silvallyflying') {
				this.add('-ability', pokemon, 'Gale Wings', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('galewings');
				pokemon.baseAbility = 'galewings';
			}
			if (pokemon.species.id === 'silvallyghost') {
				this.add('-ability', pokemon, 'Prankster', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('prankster');
				pokemon.baseAbility = 'prankster';
			}
			if (pokemon.species.id === 'silvallygrass') {
				this.add('-ability', pokemon, 'Grassy Surge', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('grassysurge');
				pokemon.baseAbility = 'grassysurge';
			}
			if (pokemon.species.id === 'silvallyground') {
				this.add('-ability', pokemon, 'Mold Breaker', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('moldbreaker');
				pokemon.baseAbility = 'moldbreaker';
			}
			if (pokemon.species.id === 'silvallyice') {
				this.add('-ability', pokemon, 'Refrigerate', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('refrigerate');
				pokemon.baseAbility = 'refrigerate';
			}
			if (pokemon.species.id === 'silvallypoison') {
				this.add('-ability', pokemon, 'Corrosion', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('corrosion');
				pokemon.baseAbility = 'corrosion';
			}
			if (pokemon.species.id === 'silvallypsychic') {
				this.add('-ability', pokemon, 'Magic Guard', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('magicguard');
				pokemon.baseAbility = 'magicguard';
			}
			if (pokemon.species.id === 'silvallyrock') {
				this.add('-ability', pokemon, 'Sand Stream', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('sandstream');
				pokemon.baseAbility = 'sandstream';
			}
			if (pokemon.species.id === 'silvallysteel') {
				this.add('-ability', pokemon, 'Magnet Pull', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('magnetpull');
				pokemon.baseAbility = 'magnetpull';
			}
			if (pokemon.species.id === 'silvallywater') {
				this.add('-ability', pokemon, 'Water Absorb', '[from] ability: RKS System', '[of] ' + pokemon);
				pokemon.setAbility('waterabsorb');
				pokemon.baseAbility = 'waterabsorb';
			}
		},
		isPermanent: null,
		name: "RKS System",
		shortDesc: "Ability varies based on the user's type.",
		rating: 4,
		num: 225,
	},
	staticcling: {
		onTakeItem(item, pokemon, source) {
			if (this.suppressingAttackEvents(pokemon) || !pokemon.hp || pokemon.item === 'stickybarb') return;
			if (!this.activeMove) throw new Error("Battle.activeMove is null");
			if ((source && source !== pokemon) || this.activeMove.id === 'knockoff') {
				this.add('-activate', pokemon, 'ability: Static Cling');
				return false;
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (move.flags['contact']) {
				if (target.item || target.switchFlag || target.forceSwitchFlag || source.switchFlag === true) {
					return;
				}
				const yourItem = source.takeItem(target);
				if (!yourItem) {
					return;
				}
				if (!target.setItem(yourItem)) {
					source.item = yourItem.id;
					return;
				}
				this.add('-enditem', source, yourItem, '[silent]', '[from] ability: Static Cling', '[of] ' + source);
				this.add('-item', target, yourItem, '[from] ability: Static Cling', '[of] ' + source);
			}
		},
		onSourceHit(target, source, move) {
			if (!move || !target) return;
			if (target !== source && move.flags['contact']) {
				if (source.item || source.volatiles['gem'] || move.id === 'fling') return;
				const yourItem = target.takeItem(source);
				if (!yourItem) return;
				if (!source.setItem(yourItem)) {
					target.item = yourItem.id; // bypass setItem so we don't break choicelock or anything
					return;
				}
				this.add('-enditem', source, yourItem, '[silent]', '[from] ability: Static Cling', '[of] ' + source);
				this.add('-item', target, yourItem, '[from] ability: Static Cling', '[of] ' + source);
			}
		},
		name: "Static Cling",
		shortDesc: "This Pokemon cannot lose its held item. Contact: Steals opponent's item on contact, if the user has no item.",
		rating: 0,
		num: 1001,
	},
	rarecold: {
		onSourceModifyDamage(damage, source, target, move) {
			if (source.getStat('spe', false, true) <= target.getStat('spe', false, true) && !move.priority > 0.1) {
				return this.chainModify(0.7);
			}
		},
		name: "Rare Cold",
		shortDesc: "User takes 30% less damage if user moves before the target.",
		rating: 0,
		num: 1002,
	},
	watercycle: {
		onBasePower(basePower, attacker, defender, move) {
			if (defender.volatiles['partiallytrapped']) {
				return this.chainModify(1.3);
			}
		},
		name: "Water Cycle",
		shortDesc: "User deal 1.3x damage to trapped targets.",
		rating: 0,
		num: 1003,
	},
	cloudburst: {
		onBeforeMove(source, target, move) {
			if (move.type === 'Electric' && !this.field.isWeather('raindance')) {
				this.useMove('raindance', source);
			}
		},
		name: "Cloud Burst",
		shortDesc: "User summons Rain before executing an Electric-type move.",
		rating: 0,
		num: 1004,
	},
	packleader: {
		onModifyAtk(atk, source, target, move) {
			if (target.newlySwitched || this.queue.willMove(target)) {
				this.debug('Pack Leader boost');
				return this.chainModify(1.3);
			}
		},
		name: "Pack Leader",
		shortDesc: "If this Pokemon goes first, it deals 1.3x damage.",
		rating: 0,
		num: 1005,
	},
	privatewifi: {
		onStart(source) {
			if (source.hasItem('burndrive')) {
				source.types[1] = 'Fire';
			}
			else if (source.hasItem('chilldrive')) {
				source.types[1] = 'Ice';
			}
			else if (source.hasItem('dousedrive')) {
				source.types[1] = 'Water';
			}
			else if (source.hasItem('shockdrive')) {
				source.types[1] = 'Electric';
			}
			this.add('-activate', source, 'ability: Private Wi-Fi');
			this.add('-message', `${source.name} changed its type to match its Drive!`);
			for (const foeactive of source.side.foe.active) {
				console.log(foeactive.hasType("Steel"));
				if (
					!foeactive || 
					foeactive.fainted || 
					(
						!foeactive.hasType(source.types[1]) && 
						!foeactive.hasType("Steel")
					)
				) continue;
				// Boosts player's Pokemon's highest stat
				let statName = 'atk';
				let bestStat = 0;
				let s: StatIDExceptHP;
				for (s in source.storedStats) {
					if (source.storedStats[s] > bestStat) {
						statName = s;
						bestStat = source.storedStats[s];
					}
				}
				this.boost({[statName]: 1}, source);

				// Boosts opponent's Pokemon's highest stat
				let statNameOpp = 'atk';
				let bestStatOpp = 0;
				let sOpp: StatIDExceptHP;
				for (sOpp in foeactive.storedStats) {
					if (foeactive.storedStats[sOpp] > bestStatOpp) {
						statNameOpp = sOpp;
						bestStatOpp = foeactive.storedStats[sOpp];
					}
				}
				this.boost({[statNameOpp]: 1}, foeactive);
			}
		},
		name: "Private Wi-Fi",
		shortDesc: "If this Pokemon switches in and the opposing Pokemon shares its type, both have their highest stat boosted.",
		rating: 0,
		num: 1006,
	},
	mountaineer: {
		onDamage(damage, target, source, effect) {
			if (effect && effect.id === 'stealthrock') {
				return false;
			}
		},
		onTryHit(target, source, move) {
			if (move.type === 'Rock' && !target.activeTurns) {
				this.add('-immune', target, '[from] ability: Mountaineer');
				return null;
			}
		},
		isNonstandard: null,
		name: "Mountaineer",
		rating: 3,
		num: -2,
	},
	lifegem: {
		onModifyDamage(damage, source, target, move) {
			return this.chainModify(1.3);
		},
		onAfterMoveSecondarySelf(source, target, move) {
			if (source && source !== target && move && move.category !== 'Status') {
				this.damage(source.baseMaxhp / 10, source, source, this.dex.getAbility('lifegem'));
			}
		},
		name: "Life Gem",
		shortDesc: "Holder's attacks do 1.3x damage, and it loses 1/10 its max HP after the attack.",
		rating: 3,
		num: 1007,
	},
	powercore: {
		// Hazard Immunity implemented in moves.js
		onBoost(boost, target, source, effect) {
			if (effect && effect.id === 'zpower') return;
			let i: BoostName;
			for (i in boost) {
				delete boost[i];
				this.add('-ability', target, 'Power Core');
				this.hint("Power Core prevents stat changes for the user.");
			}
		},
		name: "Power Core",
		shortDesc: "Immunity to hazards and any kind of stat changes.",
		rating: 3,
		num: 1008,
	},
	aerialmenace: {
		onTryHitPriority: 1,
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Flying') {
				if (!this.boost({atk: 1})) {
					this.add('-immune', target, '[from] ability: Aerial Menace');
				}
				return null;
			}
		},
		name: "Aerial Menace",
		shortDesc: "This Pokemon's attack is raised by one stage if hit by a Flying-type move; Flying-type immunity.",
		rating: 3,
		num: 1009,
   },
   shadowworld: {
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Shadow World');
		},
		onAnyBasePowerPriority: 20,
		onAnyBasePower(basePower, source, target, move) {
			if (target !== source || move.category !== 'Status' || move.type === 'Ghost' || move.type === 'Dark') {
				if (!move.auraBooster) move.auraBooster = this.effectData.target;
				if (move.auraBooster !== this.effectData.target) return;
				return this.chainModify(1.2);
			}
			else if (target !== source || move.category !== 'Status' || move.type === 'Fairy' || move.type === 'Psychic') {
				if (!move.auraBooster) move.auraBooster = this.effectData.target;
				if (move.auraBooster !== this.effectData.target) return;
				return this.chainModify(0.8);
			}
		},
		isUnbreakable: true,
		name: "Shadow World",
		shortDesc: "When this Ability is active, Ghost & Dark moves have 1.2x power. Psychic & Fairy have 0.8x power.",
		rating: 3,
		num: 1010,
	},
	burnheal: {
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			if (effect.id === 'brn') {
				this.heal(target.baseMaxhp / 8);
				return false;
			}
		},
		name: "Burn Heal",
		shortDesc: "This Pokemon is healed by 1/8 of its max HP each turn when burned; no HP loss or damage reduction.",
		rating: 4,
		num: 1011,
	},
	sharpshooter: {
		onStart(source) {
			this.useMove('lockon', source);
		},
		name: "Sharpshooter",
		shortDesc: "On switch-in, this Pokemon activates the Lock-On effect.",
		rating: 2,
		num: 1012,
	},
	forecast: {
		onSwitchIn(pokemon) {
			this.effectData.switchingIn = true;
		},
		onStart(pokemon) {
			if (this.effectData.switchingIn) {
				if (this.field.isWeather('raindance')) {
					this.field.clearWeather();
					this.field.setWeather('raindance');
				}
				if (this.field.isWeather('sunnyday')) {
					this.field.clearWeather();
					this.field.setWeather('sunnyday');
				}
				if (this.field.isWeather('sandstorm')) {
					this.field.clearWeather();
					this.field.setWeather('sandstorm');
				}
				if (this.field.isWeather('hail')) {
					this.field.clearWeather();
					this.field.setWeather('hail');
				}
			}
		},
		onUpdate(pokemon) {
			if (pokemon.species.id !== 'catastroform') return;
			switch (pokemon.effectiveWeather()) {
			case 'sunnyday':
			case 'desolateland':
				if (pokemon.species.id === 'catastroform') pokemon.types[1] = 'Fire';
				break;
			case 'raindance':
			case 'primordialsea':
				if (pokemon.species.id === 'catastroform') pokemon.types[1] = 'Water';
				break;
			case 'hail':
				if (pokemon.species.id === 'catastroform') pokemon.types[1] = 'Ice';
				break;
			case 'sandstorm':
				if (pokemon.species.id === 'catastroform') pokemon.types[1] = 'Rock';
				break;
			default:
				if (pokemon.species.id === 'catastroform') return;
				break;
			}
		},
		name: "Forecast",
		shortDesc: "Upon Entry, resets any regular weather. Gets secondary typing matching weather.",
		rating: 2,
		num: 59,
	},
	liquidscales: {
		name: "Liquid Scales",
		shortDesc: "If targeted by a foe's move, this Pokemon restores 1/10 max HP.",
		onDamagingHit(damage, target, source, move) {
			if (move.category !== 'Status') {
				this.heal(target.baseMaxhp / 10);
			}
		},
		rating: 3,
		num: 1013,
	},
	flowergift: {
		onModifyAtkPriority: 3,
		onModifyAtk(atk, pokemon) {
			if (pokemon.species.id !== 'shayminsky') return;
			if (['sunnyday', 'desolateland'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(1.5);
			}
		},
		onModifySpDPriority: 4,
		onModifySpD(spd, pokemon) {
			if (pokemon.species.id !== 'shayminsky') return;
			if (['sunnyday', 'desolateland'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(1.5);
			}
		},
		name: "Flower Gift",
		shortDesc: "If user is Shaymin-Sky and Sunny Day is active, its Attack and Sp. Def are 1.5x.",
		rating: 1,
		num: 122,
	},
	mistycoat: {
		onModifySpDPriority: 6,
		onModifySpD(pokemon) {
			if (this.field.isTerrain('mistyterrain')) return this.chainModify(1.5);
		},
		name: "Misty Coat",
		shortDesc: "If Misty Terrain is active, this Pokemon's Special Defense is multiplied by 1.5.",
		rating: 0.5,
		num: 1014,
	},
};
