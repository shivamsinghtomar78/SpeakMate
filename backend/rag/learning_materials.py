"""Default learning materials for the English practice system."""
from models.schemas import ProficiencyLevel


# ============ Default Grammar Rules ============

DEFAULT_GRAMMAR_RULES = [
    # Beginner Level
    {
        "topic": "present_simple",
        "level": "beginner",
        "content": "Use present simple for habits, routines, and general truths. Add -s/-es for he/she/it.",
        "examples": [
            "I work every day.",
            "She works at a hospital.",
            "The sun rises in the east."
        ],
        "common_mistakes": [
            "He work every day (missing -s)",
            "She don't like coffee (should be doesn't)"
        ]
    },
    {
        "topic": "present_continuous",
        "level": "beginner",
        "content": "Use present continuous for actions happening now or temporary situations. Form: am/is/are + verb-ing.",
        "examples": [
            "I am eating lunch right now.",
            "She is working from home this week.",
            "They are studying English."
        ],
        "common_mistakes": [
            "I eating now (missing am)",
            "She is work (missing -ing)"
        ]
    },
    {
        "topic": "articles",
        "level": "beginner",
        "content": "Use 'a' before consonant sounds, 'an' before vowel sounds. Use 'the' for specific or known things.",
        "examples": [
            "I have a car.",
            "She ate an apple.",
            "The book on the table is mine."
        ],
        "common_mistakes": [
            "I have car (missing article)",
            "I saw a elephant (should be 'an')"
        ]
    },
    
    # Intermediate Level
    {
        "topic": "present_perfect",
        "level": "intermediate",
        "content": "Use present perfect for actions starting in past and continuing to now, or for past actions with present relevance. Form: have/has + past participle.",
        "examples": [
            "I have lived here for 5 years.",
            "She has already finished her work.",
            "Have you ever been to Japan?"
        ],
        "common_mistakes": [
            "I am living here since 2020 (should be 'have lived')",
            "I have went there (should be 'have gone')"
        ]
    },
    {
        "topic": "conditionals_first",
        "level": "intermediate",
        "content": "First conditional for real/possible future situations. Structure: If + present simple, will + base verb.",
        "examples": [
            "If it rains tomorrow, I will stay home.",
            "If you study hard, you will pass the exam.",
            "I will call you if I have time."
        ],
        "common_mistakes": [
            "If it will rain tomorrow... (use present simple after 'if')",
            "If I will have time... (wrong tense)"
        ]
    },
    {
        "topic": "past_perfect",
        "level": "intermediate",
        "content": "Use past perfect for an action that happened before another past action. Form: had + past participle.",
        "examples": [
            "When I arrived, they had already left.",
            "She realized she had forgotten her keys.",
            "He had never seen snow before that day."
        ],
        "common_mistakes": [
            "When I arrived, they already left (should use 'had left')",
            "Before I moved here, I never saw snow (should use 'had seen')"
        ]
    },
    
    # Advanced Level
    {
        "topic": "conditionals_third",
        "level": "advanced",
        "content": "Third conditional for unreal past situations. Structure: If + past perfect, would have + past participle.",
        "examples": [
            "If I had known, I would have helped.",
            "She would have passed if she had studied more.",
            "If they had left earlier, they wouldn't have missed the train."
        ],
        "common_mistakes": [
            "If I would have known... (should be 'If I had known')",
            "If I had knew... (should be 'had known')"
        ]
    },
    {
        "topic": "subjunctive",
        "level": "advanced",
        "content": "Use subjunctive after certain verbs (suggest, recommend, insist) and expressions (it's important that). Use base verb form.",
        "examples": [
            "I suggest that he be more careful.",
            "It's essential that she arrive on time.",
            "They recommended that we take the early flight."
        ],
        "common_mistakes": [
            "I suggest that he is more careful (use base form)",
            "It's important that she arrives (use 'arrive')"
        ]
    },
    {
        "topic": "inversion",
        "level": "advanced",
        "content": "Use inversion for emphasis with negative adverbs (never, rarely, seldom) and conditional structures.",
        "examples": [
            "Never have I seen such beauty.",
            "Rarely does she make mistakes.",
            "Had I known, I would have helped. (= If I had known)"
        ],
        "common_mistakes": [
            "Never I have seen... (auxiliary must come before subject)",
            "Had I knew... (use past participle)"
        ]
    },
]


# ============ Default Vocabulary ============

DEFAULT_VOCABULARY = [
    # Beginner
    {"word": "appreciate", "definition": "To be thankful for something", "level": "beginner", "usage": "I really appreciate your help.", "pronunciation": "/əˈpriːʃieɪt/", "topic": "daily"},
    {"word": "convenient", "definition": "Easy to use or suitable for your needs", "level": "beginner", "usage": "This location is very convenient for shopping.", "pronunciation": "/kənˈviːniənt/", "topic": "daily"},
    {"word": "experience", "definition": "Knowledge or skill from doing something", "level": "beginner", "usage": "I have five years of experience in teaching.", "pronunciation": "/ɪkˈspɪəriəns/", "topic": "academic"},
    
    # Intermediate
    {"word": "accomplish", "definition": "To succeed in doing something", "level": "intermediate", "usage": "She accomplished all her goals this year.", "pronunciation": "/əˈkʌmplɪʃ/", "topic": "academic"},
    {"word": "collaborate", "definition": "To work together with others", "level": "intermediate", "usage": "We need to collaborate on this project.", "pronunciation": "/kəˈlæbəreɪt/", "topic": "business"},
    {"word": "implement", "definition": "To put a plan or system into action", "level": "intermediate", "usage": "The company will implement new policies next month.", "pronunciation": "/ˈɪmplɪment/", "topic": "business"},
    {"word": "perspective", "definition": "A particular way of thinking about something", "level": "intermediate", "usage": "From my perspective, this is the best solution.", "pronunciation": "/pəˈspektɪv/", "topic": "academic"},
    
    # Advanced
    {"word": "serendipity", "definition": "Finding something good by chance", "level": "advanced", "usage": "Meeting her was pure serendipity.", "pronunciation": "/ˌserənˈdɪpɪti/", "topic": "daily"},
    {"word": "ephemeral", "definition": "Lasting for a very short time", "level": "advanced", "usage": "Fame can be ephemeral in the digital age.", "pronunciation": "/ɪˈfemərəl/", "topic": "academic"},
    {"word": "ubiquitous", "definition": "Present everywhere", "level": "advanced", "usage": "Smartphones have become ubiquitous in modern society.", "pronunciation": "/juːˈbɪkwɪtəs/", "topic": "daily"},
    {"word": "meticulous", "definition": "Very careful and precise", "level": "advanced", "usage": "She is meticulous about her research.", "pronunciation": "/məˈtkjʊləs/", "topic": "academic"},
]


# ============ Pronunciation Guides ============

DEFAULT_PRONUNCIATION = [
    {"word": "thought", "phonetic": "/θɔːt/", "common_mistakes": "Often pronounced as 'tought' or 'fought'", "tips": "Place tongue between teeth for 'th' sound. The 'ough' is silent."},
    {"word": "through", "phonetic": "/θruː/", "common_mistakes": "Often confused with 'threw'", "tips": "Same 'th' as 'thought'. The 'ough' makes an 'oo' sound."},
    {"word": "clothes", "phonetic": "/kloʊðz/", "common_mistakes": "Often pronounced as 'close' or with a hard 'th'", "tips": "The 'th' is soft (voiced). Don't emphasize the 'e'."},
    {"word": "comfortable", "phonetic": "/ˈkʌmftəbəl/", "common_mistakes": "Pronouncing all syllables: com-for-ta-ble", "tips": "Native speakers say: KUMF-ter-bull (3 syllables)"},
    {"word": "vegetable", "phonetic": "/ˈvedʒtəbəl/", "common_mistakes": "Pronouncing as veg-e-ta-ble (4 syllables)", "tips": "Native speakers say: VEJ-tuh-bull (3 syllables)"},
    {"word": "Wednesday", "phonetic": "/ˈwenzdeɪ/", "common_mistakes": "Pronouncing the 'd' sound", "tips": "Say: WENZ-day. The first 'd' is silent."},
    {"word": "February", "phonetic": "/ˈfebrueri/", "common_mistakes": "Saying FEB-yoo-ary", "tips": "Don't skip the first 'r': FEB-roo-ary"},
    {"word": "specific", "phonetic": "/spəˈsɪfɪk/", "common_mistakes": "Saying 'pacific'", "tips": "Stress the second syllable: spuh-SI-fik"},
]


async def initialize_default_materials(db_instance):
    """Initialize the database with default learning materials."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Check if materials already exist
        grammar_count = await db_instance.db.grammar_rules.count_documents({})
        if grammar_count == 0:
            await db_instance.db.grammar_rules.insert_many(DEFAULT_GRAMMAR_RULES)
            logger.info(f"Inserted {len(DEFAULT_GRAMMAR_RULES)} grammar rules")
        
        vocab_count = await db_instance.db.vocabulary.count_documents({})
        if vocab_count == 0:
            await db_instance.db.vocabulary.insert_many(DEFAULT_VOCABULARY)
            logger.info(f"Inserted {len(DEFAULT_VOCABULARY)} vocabulary items")
        
        pron_count = await db_instance.db.pronunciation.count_documents({})
        if pron_count == 0:
            await db_instance.db.pronunciation.insert_many(DEFAULT_PRONUNCIATION)
            logger.info(f"Inserted {len(DEFAULT_PRONUNCIATION)} pronunciation guides")
            
        logger.info("Default learning materials initialized")
        
    except Exception as e:
        logger.error(f"Failed to initialize learning materials: {e}")
