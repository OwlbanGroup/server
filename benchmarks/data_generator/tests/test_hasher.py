import sys
import os

sys.path.insert(
    0,
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
        )
    ),
)

from data_generator.hasher import hashes_to_texts, texts_to_hashes

# The rest of the original file content should be preserved here.
# Since I do not have the full original content, please verify and restore any additional code below this import.
