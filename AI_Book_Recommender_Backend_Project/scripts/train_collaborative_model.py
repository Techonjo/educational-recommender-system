import os
import sys
import joblib
import pandas as pd
import numpy as np
from sklearn.decomposition import TruncatedSVD
import logging

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import engine
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define weights for different interaction types
INTERACTION_WEIGHTS = {
    "view": 1.0,
    "click": 2.0,
    "add_to_list": 3.0,
    "rate": 0.0 # Handled specially, uses the actual rating if available
}

def train_collaborative_model():
    logger.info("Fetching interactions from database...")
    
    # Load interactions from the database
    query = "SELECT user_id, book_id, interaction_type, rating FROM interactions"
    try:
        df = pd.read_sql(query, con=engine)
    except Exception as e:
        logger.error(f"Failed to fetch interactions: {e}")
        return

    if df.empty:
        logger.warning("No interactions found. Cannot train collaborative model.")
        return

    logger.info(f"Loaded {len(df)} interactions.")

    # Calculate scores based on interaction type and rating
    def calculate_score(row):
        if row['interaction_type'] == 'rate' and pd.notnull(row['rating']):
            return float(row['rating']) # e.g. 1 to 5
        return INTERACTION_WEIGHTS.get(row['interaction_type'], 1.0)

    df['score'] = df.apply(calculate_score, axis=1)

    # If a user interacted with the same book multiple times, take the max score
    # (e.g. they viewed it then rated it -> we want the rating)
    df_grouped = df.groupby(['user_id', 'book_id'])['score'].max().reset_index()

    # Create the User-Item matrix (pivot table)
    # Rows: users, Columns: books, Values: scores
    # Fill missing values with 0
    user_item_matrix = df_grouped.pivot(index='user_id', columns='book_id', values='score').fillna(0)
    
    if user_item_matrix.empty or user_item_matrix.shape[0] < 2 or user_item_matrix.shape[1] < 2:
        logger.warning("Not enough data to train SVD model (need at least 2 users and 2 books).")
        return

    logger.info(f"User-Item matrix shape: {user_item_matrix.shape}")

    # Convert to numpy array
    matrix_values = user_item_matrix.values

    # Fit Truncated SVD
    # n_components should be less than the min(n_users, n_items)
    n_components = min(20, min(matrix_values.shape) - 1)
    if n_components < 1:
        logger.warning("Not enough variance/components to train.")
        return
        
    logger.info(f"Training TruncatedSVD with {n_components} components...")
    
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    user_factors = svd.fit_transform(matrix_values) # Shape: (n_users, n_components)
    item_factors = svd.components_.T # Shape: (n_items, n_components)

    logger.info(f"Explained variance ratio sum: {svd.explained_variance_ratio_.sum():.2f}")

    # Save the artifacts
    os.makedirs(os.path.dirname(settings.CF_USER_FACTORS_PATH), exist_ok=True)
    
    # Save the matrices
    joblib.dump(user_factors, settings.CF_USER_FACTORS_PATH)
    joblib.dump(item_factors, settings.CF_ITEM_FACTORS_PATH)
    
    # Save the index mapping (to map row/col index back to user_id/book_id)
    user_index = user_item_matrix.index.tolist()
    item_index = user_item_matrix.columns.tolist()
    
    with open(settings.CF_USER_INDEX_PATH, 'w') as f:
        import json
        json.dump(user_index, f)
        
    with open(settings.CF_ITEM_INDEX_PATH, 'w') as f:
        import json
        json.dump(item_index, f)
        
    logger.info("Model artifacts saved successfully:")
    logger.info(f"- {settings.CF_USER_FACTORS_PATH}")
    logger.info(f"- {settings.CF_ITEM_FACTORS_PATH}")
    logger.info(f"- {settings.CF_USER_INDEX_PATH}")
    logger.info(f"- {settings.CF_ITEM_INDEX_PATH}")

if __name__ == "__main__":
    train_collaborative_model()
